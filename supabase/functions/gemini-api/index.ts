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
        prompt = "You are an AI fashion model generator. Your task is to create a professional fashion model photo from the person in this image.\n\nCRITICAL REQUIREMENTS:\n1. BODY & IDENTITY: Preserve the person's exact facial features, skin tone, hair, body shape, and proportions. Keep their natural appearance intact.\n2. POSE: Place them in a straight, relaxed standing pose with arms naturally at their sides or slightly away from the body. The pose must be neutral and suitable for showing clothing.\n3. FRAMING: Generate a full-body shot from head to toe. Ensure the entire body is visible including feet. The person should be centered in the frame.\n4. BACKGROUND: Use a clean, solid light gray studio background (#f0f0f0). No shadows, textures, or distractions.\n5. LIGHTING: Apply professional, even studio lighting without harsh shadows. The lighting should be bright and flattering.\n6. EXPRESSION: Neutral, calm, confident expression. Professional model demeanor.\n7. QUALITY: The output must be photorealistic, high-resolution, and look like a professional e-commerce fashion photograph.\n8. CLOTHING: Keep their current clothing unchanged for now.\n\nReturn ONLY the generated image with no text or annotations.";
        parts = [
          { inline_data: { mime_type: body.userImage.split(';')[0].split(':')[1], data: body.userImage.split(',')[1] } },
          { text: prompt }
        ];
        break;

      case 'generateTryOn':
        if (!body.modelImage || !body.garmentImage) throw new Error('modelImage and garmentImage are required');
        prompt = "You are an advanced, professional AI Avatar & Virtual Try-On system. Your task is to take the person from the first image and flawlessly impose the new garment from the second image onto them, creating a hyper-realistic, professional fashion photograph.\n\n### CRITICAL DIRECTIVE: MANDATORY GARMENT SWAP\n1.  **GARMENT APPLICATION (PRIORITY 1):** You *MUST*, without exception, **completely and cleanly remove ALL original clothing** from the person and **flawlessly REPLACE it with the garment** from the second input image.\n2.  **NO TRACE OF OLD CLOTHING:** Ensure absolutely no part of the original attire is visible. The new garment must be the *only* clothing present.\n3.  **REALISM & FIT:** The new garment must perfectly preserve its color, pattern, texture, and design. It must fit the person's body shape and pose naturally, simulating authentic fabric draping, folds, and wrinkles based on the material.\n\n### CRITICAL DIRECTIVE: IDENTITY & CONTEXT PRESERVATION\n4.  **IDENTITY PRESERVATION (PRIORITY 2):** Preserve the person's exact **face, facial features, expression, hair (style and color), skin tone, and body proportions** without any modification. The final output must be unmistakably the same individual.\n5.  **POSE & COMPOSITION:** Maintain a straight-on, neutral, relaxed standing pose. The framing must be a centered, full-body shot.\n6.  **BACKGROUND:** The background must be a clean, solid light grey studio background **(#f0f0f0)**, free of shadows or distractions.\n\n### FINAL INTEGRATION & QUALITY:\n7.  **LIGHTING MATCH:** The lighting and shadows on the new garment must **perfectly match** the professional, even studio lighting of the scene. Add realistic shadows where the fabric interacts with itself and the body.\n8.  **PHOTOREALISM:** The final image must be of the highest photorealistic and high-resolution quality, looking exactly like a final, polished e-commerce studio photograph.\n\n**OUTPUT:** Return ONLY the final composite image. No text, labels, or annotations.";
        parts = [
          { inline_data: { mime_type: body.modelImage.split(';')[0].split(':')[1], data: body.modelImage.split(',')[1] } },
          { inline_data: { mime_type: body.garmentImage.split(';')[0].split(':')[1], data: body.garmentImage.split(',')[1] } },
          { text: prompt }
        ];
        break;

      case 'generatePose':
        if (!body.tryOnImage || !body.poseInstruction) throw new Error('tryOnImage and poseInstruction are required');
        prompt = `You are an AI fashion photographer. Recreate this fashion photograph with a different pose/angle.\n\nNEW POSE REQUESTED: ${body.poseInstruction}\n\nCRITICAL REQUIREMENTS:\n1. PRESERVE IDENTITY: Keep the person's face, facial features, skin tone, hair, and body exactly the same\n2. PRESERVE CLOTHING: Keep the exact same garment with all its colors, patterns, textures, and design details\n3. PRESERVE BACKGROUND: Maintain the same background style and studio setting\n4. CHANGE POSE: Adjust the person's pose/stance/body position to match: "${body.poseInstruction}"\n5. NATURAL MOVEMENT: Ensure the new pose looks natural and the clothing drapes realistically\n6. LIGHTING: Adjust lighting naturally for the new angle while maintaining studio quality\n7. QUALITY: Maintain photorealistic quality as if this was a professional fashion shoot from a different angle\n\nReturn ONLY the final image showing the same person in the same outfit but in the new pose.`;
        parts = [
          { inline_data: { mime_type: body.tryOnImage.split(';')[0].split(':')[1], data: body.tryOnImage.split(',')[1] } },
          { text: prompt }
        ];
        break;

      default:
        throw new Error('Invalid action');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,

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
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          const inlineData = part.inlineData || part.inline_data;
          if (inlineData) {
            const { mimeType, mime_type, data } = inlineData;
            const finalMimeType = mimeType || mime_type || 'image/jpeg';
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