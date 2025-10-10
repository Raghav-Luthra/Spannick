/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { supabase } from '../lib/supabase';

const fileToDataUrl = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const callEdgeFunction = async (action: string, payload: any): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-api`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Edge function error: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl;
};

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImageDataUrl = await fileToDataUrl(userImage);
    return callEdgeFunction('generateModel', { userImage: userImageDataUrl });
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File): Promise<string> => {
    const garmentImageDataUrl = await fileToDataUrl(garmentImage);
    return callEdgeFunction('generateTryOn', { modelImage: modelImageUrl, garmentImage: garmentImageDataUrl });
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    return callEdgeFunction('generatePose', { tryOnImage: tryOnImageUrl, poseInstruction });
};