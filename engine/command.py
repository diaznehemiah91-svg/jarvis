import time
import eel

# Optional voice dependencies — JARVIS still runs (text-only) if they're missing.
try:
    import pyttsx3
    TTS_AVAILABLE = True
except Exception:
    TTS_AVAILABLE = False

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except Exception:
    SR_AVAILABLE = False


def speak(text):
    text = str(text)
    # Always update the UI, even if the local TTS engine is unavailable.
    try:
        eel.DisplayMessage(text)
        eel.receiverText(text)
    except Exception:
        pass
    if not TTS_AVAILABLE:
        print(f"[jarvis] {text}")
        return
    try:
        engine = pyttsx3.init('sapi5')
        voices = engine.getProperty('voices')
        engine.setProperty('voice', voices[0].id)
        engine.setProperty('rate', 174)
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"[jarvis tts unavailable] {text}  ({e})")


def takecommand():
    if not SR_AVAILABLE:
        print("[jarvis] speech recognition unavailable — use typed commands.")
        return ""

    r = sr.Recognizer()

    try:
        with sr.Microphone() as source:
            print('listening....')
            eel.DisplayMessage('listening....')
            r.pause_threshold = 1
            r.adjust_for_ambient_noise(source)

            audio = r.listen(source, 10, 6)
    except Exception as e:
        print(f"[jarvis] microphone unavailable: {e}")
        return ""

    try:
        print('recognizing')
        eel.DisplayMessage('recognizing....')
        query = r.recognize_google(audio, language='en-in')
        print(f"user said: {query}")
        eel.DisplayMessage(query)
        time.sleep(2)

    except Exception as e:
        return ""

    return query.lower()

@eel.expose
def allCommands(message=1):

    if message == 1:
        query = takecommand()
        print(query)
        eel.senderText(query)
    else:
        query = message
        eel.senderText(query)
    try:

        if "weather" in query or "temperature" in query or "forecast" in query:
            from engine.features import getWeather
            getWeather(query)
        elif "on spotify" in query or "spotify" in query:
            from engine.features import PlaySpotify
            PlaySpotify(query)
        elif "open" in query:
            from engine.features import openCommand
            openCommand(query)
        elif "on youtube" in query:
            from engine.features import PlayYoutube
            PlayYoutube(query)

        elif "market regime" in query or "flow tracker" in query or "institutional flow" in query:
            from engine.trading.regime import compute_regime_score
            from engine.trading.alerts import generate_full_briefing
            regime = compute_regime_score()
            speak(f"Current market regime: {regime['regime_label']}. "
                  f"Regime score is {regime['regime_score']:.2f}. VIX at {regime['vix_level']:.1f}.")
            speak(regime['actions'][0] if regime['actions'] else "No specific actions.")

        elif "flow scan" in query or "whale block" in query or "options sweep" in query:
            from engine.trading.flow_tracker import run_full_scan
            speak("Running institutional flow scan across all tracked tickers.")
            result = run_full_scan()
            total = result['total_alerts']
            speak(f"Scan complete. Detected {total} institutional flow signals. "
                  f"{len(result['whale_blocks'])} whale blocks and "
                  f"{len(result['options_sweeps'])} options sweeps.")

        elif "sector sentiment" in query or "market sentiment" in query:
            from engine.trading.sentiment import score_reddit, score_news
            speak("Running sentiment analysis across all sectors. Please wait.")
            score_reddit()
            score_news()
            speak("Sentiment pipeline complete. Check the flow tracker dashboard for details.")

        elif "refresh market" in query or "update tickers" in query:
            from engine.trading.market_data import refresh_all_tickers
            speak("Refreshing market data for all tracked tickers.")
            result = refresh_all_tickers()
            speak(f"Market data refresh complete. Updated {len(result['refreshed'])} tickers.")

        elif "send message" in query or "phone call" in query or "video call" in query:
            from engine.features import findContact, whatsApp, makeCall, sendMessage
            contact_no, name = findContact(query)
            if(contact_no != 0):
                speak("Which mode you want to use whatsapp or mobile")
                preferance = takecommand()
                print(preferance)

                if "mobile" in preferance:
                    if "send message" in query or "send sms" in query: 
                        speak("what message to send")
                        message = takecommand()
                        sendMessage(message, contact_no, name)
                    elif "phone call" in query:
                        makeCall(name, contact_no)
                    else:
                        speak("please try again")
                elif "whatsapp" in preferance:
                    message = ""
                    if "send message" in query:
                        message = 'message'
                        speak("what message to send")
                        query = takecommand()
                                        
                    elif "phone call" in query:
                        message = 'call'
                    else:
                        message = 'video call'
                                        
                    whatsApp(contact_no, query, message, name)

        else:
            from engine.features import geminai
            geminai(query)
    except:
        print("error")
    
    eel.ShowHood()