import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Create an in-memory dictionary index
let dictionaryIndex: Map<string, { tongan: string; english: string }> | null = null;

// Function to translate using Azure Translator REST API
async function translateWithAzure(word: string): Promise<{ tongan: string; english: string } | null> {
  try {
    const translatorKey = process.env.AZURE_TRANSLATOR_KEY;
    const translatorEndpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;

    if (!translatorKey || !translatorEndpoint) {
      console.error('Azure Translator credentials not found');
      return null;
    }

    // Add region to the endpoint if it's not already included
    const region = process.env.AZURE_TRANSLATOR_REGION || 'eastus';
    const endpoint = translatorEndpoint.includes('api.cognitive.microsofttranslator.com') 
      ? translatorEndpoint 
      : `https://api.cognitive.microsofttranslator.com`;

    const response = await fetch(`${endpoint}/translate?api-version=3.0&to=en&from=to`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': translatorKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text: word }])
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Translator API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return null;
    }

    const result = await response.json();
    
    if (result && result[0] && result[0].translations && result[0].translations[0]) {
      return {
        tongan: word,
        english: result[0].translations[0].text
      };
    }
    return null;
  } catch (error) {
    console.error('Azure Translator error:', error);
    return null;
  }
}

// Function to initialize the dictionary index
async function initializeDictionary() {
  if (dictionaryIndex) return; // Already initialized

  try {
    const dictionaryPath = path.join(process.cwd(), 'public', 'tongan_dictionary.tsv');
    const fileContent = await fs.readFile(dictionaryPath, 'utf-8');
    const lines = fileContent.split('\n');
    
    dictionaryIndex = new Map();
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split('\t');
      if (parts.length >= 8 && dictionaryIndex) {
        const tonganWord = parts[1].toLowerCase().trim();
        const englishMeaning = parts[7].trim();
        
        // Handle words that have "or" in them (like "he'ene or 'ene")
        const words = tonganWord.split(' or ').map(w => w.trim());
        
        // Store each version of the word
        words.forEach(word => {
          // Store the exact word
          dictionaryIndex?.set(word, {
            tongan: parts[1].trim(),
            english: englishMeaning
          });

          // Also store a version with the apostrophe replaced with a regular apostrophe
          if (word.includes("'") || word.includes("ʻ")) {
            const normalizedWord = word.replace(/['ʻ]/g, "'");
            if (normalizedWord !== word) {
              dictionaryIndex?.set(normalizedWord, {
                tongan: parts[1].trim(),
                english: englishMeaning
              });
            }
          }

          // Store versions with and without the apostrophe for words like "he'ene" or "'ene"
          if (word.startsWith("'") || word.startsWith("ʻ")) {
            const withoutApostrophe = word.substring(1);
            dictionaryIndex?.set(withoutApostrophe, {
              tongan: parts[1].trim(),
              english: englishMeaning
            });
          }
          if (word.includes("'") || word.includes("ʻ")) {
            const withoutApostrophe = word.replace(/['ʻ]/g, "");
            if (withoutApostrophe !== word) {
              dictionaryIndex?.set(withoutApostrophe, {
                tongan: parts[1].trim(),
                english: englishMeaning
              });
            }
          }
        });
      }
    }
    
    console.log(`Dictionary initialized with ${dictionaryIndex.size} entries`);
  } catch (error) {
    console.error('Error initializing dictionary:', error);
    dictionaryIndex = null;
  }
}

// Initialize dictionary when the module loads
initializeDictionary();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const encodedWord = searchParams.get('word');
    const word = encodedWord ? decodeURIComponent(encodedWord).toLowerCase().trim() : undefined;

    if (!word) {
      return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
    }

    // Ensure dictionary is initialized
    if (!dictionaryIndex) {
      await initializeDictionary();
    }

    // Normalize the word by replacing any type of apostrophe with a regular apostrophe
    const normalizedWord = word.replace(/['ʻ]/g, "'");

    // Look up the word in the index
    const entry = dictionaryIndex?.get(normalizedWord);
    
    if (entry) {
      return NextResponse.json(entry);
    }

    // If the word starts with an apostrophe, try looking up the word without the apostrophe
    if (normalizedWord.startsWith("'")) {
      const wordWithoutApostrophe = normalizedWord.substring(1);
      const entryWithoutApostrophe = dictionaryIndex?.get(wordWithoutApostrophe);
      
      if (entryWithoutApostrophe) {
        return NextResponse.json(entryWithoutApostrophe);
      }
    }

    // If word not found in dictionary, try Azure Translator
    const azureTranslation = await translateWithAzure(word);
    if (azureTranslation) {
      return NextResponse.json(azureTranslation);
    }

    return NextResponse.json({ error: 'Word not found' }, { status: 404 });
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 