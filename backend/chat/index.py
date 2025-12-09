import json
import urllib.request
import urllib.error
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обрабатывает запросы к AI чату, используя бесплатный API HuggingFace
    Args: event - содержит httpMethod, body с message и history
          context - объект с request_id, function_name и другими атрибутами
    Returns: JSON ответ с текстом от AI
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        user_message = body_data.get('message', '')
        language = body_data.get('language', 'ru')
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Message is required'}),
                'isBase64Encoded': False
            }
        
        system_prompt = (
            "Ты - дружелюбный AI-ассистент Mega Chat. "
            "Отвечай кратко, полезно и по существу. "
            "Будь вежливым и помогай пользователям с их вопросами."
        ) if language == 'ru' else (
            "You are a friendly AI assistant called Mega Chat. "
            "Answer briefly, helpfully and to the point. "
            "Be polite and help users with their questions."
        )
        
        api_url = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2'
        
        prompt = f"{system_prompt}\n\nUser: {user_message}\nAssistant:"
        
        request_data = json.dumps({
            'inputs': prompt,
            'parameters': {
                'max_new_tokens': 512,
                'temperature': 0.7,
                'top_p': 0.95,
                'return_full_text': False
            }
        }).encode('utf-8')
        
        req = urllib.request.Request(
            api_url,
            data=request_data,
            headers={
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = json.loads(response.read().decode('utf-8'))
                
                if isinstance(response_data, list) and len(response_data) > 0:
                    ai_response = response_data[0].get('generated_text', '').strip()
                else:
                    ai_response = response_data.get('generated_text', '').strip()
                
                if not ai_response:
                    ai_response = (
                        "Извините, я временно не могу ответить. Попробуйте позже."
                        if language == 'ru' else
                        "Sorry, I can't respond right now. Please try again later."
                    )
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'response': ai_response,
                        'request_id': context.request_id
                    }),
                    'isBase64Encoded': False
                }
                
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f"HuggingFace API error: {error_body}")
            
            fallback_response = (
                f"Я понял ваш вопрос: '{user_message}'. "
                "К сожалению, сейчас я немного перегружен запросами. "
                "Могу предложить: попробуйте переформулировать вопрос или задайте его немного позже."
                if language == 'ru' else
                f"I understood your question: '{user_message}'. "
                "Unfortunately, I'm a bit overloaded with requests right now. "
                "I suggest: try rephrasing the question or ask it a bit later."
            )
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'response': fallback_response,
                    'request_id': context.request_id
                }),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }
