import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { LanguageModelV1, experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { customMiddleware } from './custom-middleware';

export const customModel = (apiIdentifier: string) => {
  if (apiIdentifier.startsWith('deepseek')) {
    console.log('model provider Deepseek');
    return wrapLanguageModel({
      model: deepseek(apiIdentifier) as LanguageModelV1,
      middleware: customMiddleware
    });
  }else if(apiIdentifier.startsWith('gpt')){
    console.log('model provider openAi');
    return wrapLanguageModel({
      model: openai(apiIdentifier),
      middleware: customMiddleware
    });
  }else if(apiIdentifier.startsWith('claude')){
    console.log('model provider anthropic');
    return wrapLanguageModel({
      model: anthropic(apiIdentifier) as LanguageModelV1,
      middleware: customMiddleware
    });
  }else if(apiIdentifier.startsWith('gemini')){
    console.log('model provider Gemini');
    return wrapLanguageModel({
      model: google(apiIdentifier) as LanguageModelV1,
      middleware: customMiddleware
    });
  }else{
    return wrapLanguageModel({
      model: openai(apiIdentifier) as LanguageModelV1,
      middleware: customMiddleware
    });
  }

};
