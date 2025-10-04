import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  action: 'generateModel' | 'generateTryOn' | 'generatePose';
  userImage?: string;
  modelImage?: string;
  garmentImage?: string;
  tryOnImage?: string;
  poseInstruction?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service_name', 'gemini')
      .maybeSingle();

    if (apiKeyError || !apiKeyData?.api_key) {
      throw new Error('Gemini API key not found in database');
    }

    const apiKey = apiKeyData.api_key;
    const body: RequestBody = await req.json();

    let prompt = '';
    let parts: any[] = [];

    switch (body.action) {
      case 'generateModel':
        if (!body.userImage) throw new Error('userImage is required');
        prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
        parts = [
          { inline_data: { mime_type: body.userImage.split(';')[0].split(':')[1], data: body.userImage.split(',')[1] } },
          { text: prompt }
        ];
        break;

      case 'generateTryOn':
        if (!body.modelImage || !body.garmentImage) throw new Error('modelImage and garmentImage are required');
        prompt = "You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'. **Crucial Rules:** 1.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image. 2.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged. 3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly. 4.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene. 5.  **Output:** Return ONLY the final, edited image. Do not include any text.";
        parts = [
          { inline_data: { mime_type: body.modelImage.split(';')[0].split(':')[1], data: body.modelImage.split(',')[1] } },
          { inline_data: { mime_type: body.garmentImage.split(';')[0].split(':')[1], data: body.garmentImage.split(',')[1] } },
          { text: prompt }
        ];
        break;

      case 'generatePose':
        if (!body.tryOnImage || !body.poseInstruction) throw new Error('tryOnImage and poseInstruction are required');
        prompt = `Take this fashion photograph and recreate it from ${body.poseInstruction}. Keep the person, their clothing, and the background style exactly the same, just change the camera angle or perspective. Make it look like a real photograph taken from this new viewpoint.`;
        parts = [
          { inline_data: { mime_type: body.tryOnImage.split(';')[0].split(':')[1], data: body.tryOnImage.split(',')[1] } },
          { text: prompt }
        ];
        break;

      default:
        throw new Error('Invalid action');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            response_modalities: ['image']
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();

    if (geminiData.promptFeedback?.blockReason) {
      const { blockReason, blockReasonMessage } = geminiData.promptFeedback;
      throw new Error(`Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`);
    }

    for (const candidate of geminiData.candidates ?? []) {
      const imagePart = candidate.content?.parts?.find((part: any) => part.inlineData || part.inline_data);
      if (imagePart) {
        const inlineData = imagePart.inlineData || imagePart.inline_data;
        const { mimeType, mime_type, data } = inlineData;
        const finalMimeType = mimeType || mime_type;
        return new Response(
          JSON.stringify({ imageUrl: `data:${finalMimeType};base64,${data}` }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    const finishReason = geminiData.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`Image generation stopped unexpectedly. Reason: ${finishReason}`);
    }

    throw new Error('The AI model did not return an image');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});