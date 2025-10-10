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

    const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
      if (!dataUrl || typeof dataUrl !== 'string') {
        console.error('[parseDataUrl] Received invalid input:', typeof dataUrl);
        throw new Error('Data URL must be a non-empty string');
      }

      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error('[parseDataUrl] Failed to parse data URL. First 100 chars:', dataUrl.substring(0, 100));
        throw new Error(`Invalid data URL format. Expected format: data:image/...;base64,...`);
      }

      console.log('[parseDataUrl] Successfully parsed:', matches[1], 'data length:', matches[2].length);
      return { mimeType: matches[1], data: matches[2] };
    };

    switch (body.action) {
      case 'generateModel':
        if (!body.userImage) throw new Error('userImage is required');
        prompt = "You are an AI fashion model generator. Your task is to create a professional fashion model photo from the person in this image.\n\nCRITICAL REQUIREMENTS:\n1. BODY & IDENTITY: Preserve the person's exact facial features, skin tone, hair, body shape, and proportions. Keep their natural appearance intact.\n2. POSE: Place them in a straight, relaxed standing pose with arms naturally at their sides or slightly away from the body. The pose must be neutral and suitable for showing clothing.\n3. FRAMING: Generate a full-body shot from head to toe. Ensure the entire body is visible including feet. The person should be centered in the frame.\n4. BACKGROUND: Use a clean, solid light gray studio background (#f0f0f0). No shadows, textures, or distractions.\n5. LIGHTING: Apply professional, even studio lighting without harsh shadows. The lighting should be bright and flattering.\n6. EXPRESSION: Neutral, calm, confident expression. Professional model demeanor.\n7. QUALITY: The output must be photorealistic, high-resolution, and look like a professional e-commerce fashion photograph.\n8. CLOTHING: Keep their current clothing unchanged for now.\n\nReturn ONLY the generated image with no text or annotations.";
        const userImageData = parseDataUrl(body.userImage);
        parts = [
          { inline_data: { mime_type: userImageData.mimeType, data: userImageData.data } },
          { text: prompt }
        ];
        break;

      case 'generateTryOn':
        if (!body.modelImage || !body.garmentImage) throw new Error('modelImage and garmentImage are required');
        console.log('[generateTryOn] Starting try-on generation');
        console.log('[generateTryOn] Model image type:', typeof body.modelImage, 'length:', body.modelImage?.length);
        console.log('[generateTryOn] Garment image type:', typeof body.garmentImage, 'length:', body.garmentImage?.length);

        prompt = "You are an expert virtual try-on AI system. You will receive TWO images:\n1. MODEL IMAGE: A person in a fashion photo\n2. GARMENT IMAGE: A clothing item to be worn\n\nYour task: Create a photorealistic image showing the person wearing the new garment.\n\nCRITICAL INSTRUCTIONS:\n\n**GARMENT APPLICATION:**\n- COMPLETELY REMOVE the original clothing from the model\n- REPLACE it with the garment from the second image\n- The new garment must fit naturally on the person's body\n- Preserve all details of the new garment: color, pattern, texture, style, design elements\n- NO traces of the original clothing should remain visible\n- Ensure proper draping, wrinkles, and fabric behavior based on the pose\n\n**PRESERVE EXACTLY:**\n- Person's face, facial features, and expression\n- Hair style and color\n- Skin tone and body shape\n- Body proportions and posture\n- The exact pose and stance\n- The entire background without any changes\n- Lighting conditions and shadows\n\n**TECHNICAL REQUIREMENTS:**\n- The garment must adapt realistically to the person's pose\n- Add natural shadows and highlights where the fabric would create them\n- Ensure the garment fits the body properly (not too tight or loose)\n- Maintain photorealistic quality throughout\n- The lighting on the garment should match the scene lighting\n- Edges and transitions should be seamless\n\n**OUTPUT:**\nReturn ONLY the final composite image. No text, labels, or annotations.\n\nThe result must look like the person is genuinely wearing the new garment in a professional fashion photograph.";

        const modelImageData = parseDataUrl(body.modelImage);
        const garmentImageData = parseDataUrl(body.garmentImage);
        console.log('[generateTryOn] Parsed model image:', modelImageData.mimeType);
        console.log('[generateTryOn] Parsed garment image:', garmentImageData.mimeType);

        parts = [
          { inline_data: { mime_type: modelImageData.mimeType, data: modelImageData.data } },
          { inline_data: { mime_type: garmentImageData.mimeType, data: garmentImageData.data } },
          { text: prompt }
        ];
        break;

      case 'generatePose':
        if (!body.tryOnImage || !body.poseInstruction) throw new Error('tryOnImage and poseInstruction are required');
        prompt = `You are an AI fashion photographer. Recreate this fashion photograph with a different pose/angle.\n\nNEW POSE REQUESTED: ${body.poseInstruction}\n\nCRITICAL REQUIREMENTS:\n1. PRESERVE IDENTITY: Keep the person's face, facial features, skin tone, hair, and body exactly the same\n2. PRESERVE CLOTHING: Keep the exact same garment with all its colors, patterns, textures, and design details\n3. PRESERVE BACKGROUND: Maintain the same background style and studio setting\n4. CHANGE POSE: Adjust the person's pose/stance/body position to match: "${body.poseInstruction}"\n5. NATURAL MOVEMENT: Ensure the new pose looks natural and the clothing drapes realistically\n6. LIGHTING: Adjust lighting naturally for the new angle while maintaining studio quality\n7. QUALITY: Maintain photorealistic quality as if this was a professional fashion shoot from a different angle\n\nReturn ONLY the final image showing the same person in the same outfit but in the new pose.`;
        const tryOnImageData = parseDataUrl(body.tryOnImage);
        parts = [
          { inline_data: { mime_type: tryOnImageData.mimeType, data: tryOnImageData.data } },
          { text: prompt }
        ];
        break;

      default:
        throw new Error('Invalid action');
    }

    let geminiResponse;
    let retryCount = 0;
    const maxRetries = 3;

    const requestPayload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        response_modalities: ['image']
      }
    };

    console.log('[Gemini Request] Action:', body.action);
    console.log('[Gemini Request] Parts count:', parts.length);
    console.log('[Gemini Request] Parts types:', parts.map(p => p.inline_data ? 'image' : 'text'));

    while (retryCount < maxRetries) {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        }
      );

      console.log(`[Gemini Response] Attempt ${retryCount + 1}, Status: ${geminiResponse.status}`);

      if (geminiResponse.ok) {
        break;
      }

      const errorText = await geminiResponse.text();
      console.error(`[Gemini Error] Attempt ${retryCount + 1}:`, errorText);

      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`[Retry] Waiting ${1000 * retryCount}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error after ${maxRetries} attempts: ${errorText}`);
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
    console.error('[Error]', error);
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