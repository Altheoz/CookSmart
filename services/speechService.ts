import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

export interface TranscriptionResult {
  text: string;
  uri?: string;
}

async function recordShortClip(ms: number = 3500): Promise<string | null> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) return null;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true
  });

  const recording = new Audio.Recording();
  const options: any = Audio.RecordingOptionsPresets.HIGH_QUALITY;
  try {
    await recording.prepareToRecordAsync(options);
    await recording.startAsync();
    await new Promise((r) => setTimeout(r, ms));
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    return uri ?? null;
  } catch {
    try { await recording.stopAndUnloadAsync(); } catch {}
    return null;
  }
}

async function sendToGeminiTranscribe(base64Audio: string, mimeType: string): Promise<string> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    (Constants?.expoConfig?.extra as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
    (globalThis as any)?.EXPO_PUBLIC_GEMINI_API_KEY ||
    (Constants?.manifest as any)?.extra?.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return '';

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Transcribe this speech to plain lowercase text. No punctuation, no extra words.' },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Audio
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.0,
      response_mime_type: 'text/plain'
    }
  } as any;

  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify(body)
    }
  );

  if (!resp.ok) return '';
  const data = await resp.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return (text || '').trim().toLowerCase();
}

export async function transcribeOnce(): Promise<TranscriptionResult | null> {
  const uri = await recordShortClip(3500);
  if (!uri) return null;

  try {
    
    const mime = uri.endsWith('.m4a') ? 'audio/m4a' : uri.endsWith('.caf') ? 'audio/x-caf' : 'audio/mp4';
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const text = await sendToGeminiTranscribe(base64, mime);
    return { text, uri };
  } catch {
    return { text: '', uri };
  }
}

export const speechService = { transcribeOnce };


