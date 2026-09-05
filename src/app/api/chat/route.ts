import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { searchCatalog, searchPolicies } from '@/lib/rag/engine';
import { validateCheckout } from '@/lib/guardrails/gatekeeper';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { code: 'AI_CONFIG_MISSING', message: 'Gemini API key is not configured.' } },
        { status: 503 }
      );
    }
    const ai = new GoogleGenAI({ apiKey });

    const { messages } = await req.json();

    const tools: any = [
      {
        functionDeclarations: [
          {
            name: 'searchCatalog',
            description: 'Search the product catalog for items matching a query',
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING, description: 'The search query' },
              },
              required: ['query'],
            },
          },
          {
            name: 'checkStorePolicy',
            description: 'Check store policies regarding returns, warranty, discounts, etc.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING, description: 'The policy question or topic' },
              },
              required: ['query'],
            },
          },
          {
            name: 'stageCheckout',
            description: 'Stage a checkout by calculating totals and validating rules',
            parameters: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productId: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                    },
                    required: ['productId', 'quantity'],
                  },
                },
                couponCode: { type: Type.STRING },
              },
              required: ['items'],
            },
          },
        ],
      },
    ];

    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: m.parts || [{ text: m.content || '' }],
    }));

    let response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        tools,
        systemInstruction: 'You are ApexCommerce AI. Help users shop, check policies, and checkout. ALL prices are in Indian Rupees (INR). When displaying prices, ALWAYS use the ₹ symbol (e.g., ₹5,000) and NEVER use the $ symbol.',
      }
    });

    let checkoutData = null;
    let productData = null;

    let toolCalls = response.functionCalls;
    let iteration = 0;
    
    while (toolCalls && toolCalls.length > 0 && iteration < 5) {
      iteration++;
      const parts = [];
      for (const call of toolCalls) {
        let result;
        const args: any = call.args || {};
        if (call.name === 'searchCatalog') {
          result = await searchCatalog(args.query);
          productData = result;
        } else if (call.name === 'checkStorePolicy') {
          result = await searchPolicies(args.query);
        } else if (call.name === 'stageCheckout') {
          const res = await validateCheckout(args.items, args.couponCode);
          if (res.isValid) {
            result = { success: true, message: 'Checkout Staged Successfully', details: res.canonicalCart };
            // Save the canonical cart and original input to pass back to the frontend
            checkoutData = {
              items: args.items, // raw items requested
              couponCode: args.couponCode,
              canonical: res.canonicalCart
            };
          } else {
            result = { success: false, message: 'Checkout Failed', reason: res.rejectionReason };
          }
        }
        parts.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: { result }
          }
        });
      }

      if (response.candidates?.[0]?.content) {
        contents.push(response.candidates[0].content);
      } else {
        contents.push({ role: 'model', parts: toolCalls.map((c: any) => ({ functionCall: c })) });
      }
      contents.push({ role: 'user', parts });

      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          tools,
          systemInstruction: 'You are ApexCommerce AI. Help users shop, check policies, and checkout. ALL prices are in Indian Rupees (INR). When displaying prices, ALWAYS use the ₹ symbol (e.g., ₹5,000) and NEVER use the $ symbol.',
        }
      });
      
      toolCalls = response.functionCalls;
    }

    if (productData && response.text) {
      const mentioned = productData.filter((p: any) => 
        response.text?.includes(p.name) || response.text?.includes(p.id)
      );
      if (mentioned.length > 0) {
        productData = mentioned;
      } else {
        productData = [productData[0]];
      }
    }

    return NextResponse.json({
      text: response.text,
      role: 'model',
      checkoutData,
      productData
    });
  } catch (error: unknown) {
    console.error("RAW AI ERROR:", error);
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    const congested = /503|unavailable|overloaded|timeout/i.test(message);
    return NextResponse.json(
      {
        error: {
          code: congested ? 'AI_TEMPORARILY_UNAVAILABLE' : 'AI_REQUEST_FAILED',
          message: congested
            ? 'The AI service is temporarily busy. Please retry shortly.'
            : 'Unable to complete the chat request.',
        },
      },
      { status: congested ? 503 : 502 }
    );
  }
}
