import os
import eel

from engine.features import *
from engine.command import *
from engine.auth import recoganize
import engine.trading.api  # registers all @eel.expose trading endpoints


def start():
    
    eel.init("www")

    playAssistantSound()
    @eel.expose
    def init():
        # Optional device/ADB bootstrap — Windows-only batch. Never let a
        # missing file or non-Windows host block the loader from advancing.
        try:
            if os.path.exists('device.bat'):
                subprocess.call([r'device.bat'])
        except Exception as e:
            print('[init] device.bat skipped:', e)

        eel.hideLoader()
        speak("Ready for Face Authentication")

        # Face auth is optional — if the camera or face libraries are
        # unavailable we proceed instead of dead-ending on the loader.
        try:
            flag = recoganize.AuthenticateFace()
        except Exception as e:
            print('[init] face auth unavailable, skipping:', e)
            flag = 1

        if flag == 1:
            eel.hideFaceAuth()
            speak("Face Authentication Successful")
            eel.hideFaceAuthSuccess()
            speak("Hello, Welcome Sir, How can i Help You")
            eel.hideStart()
            playAssistantSound()
        else:
            # Don't strand the user on the loader — let them in.
            speak("Face Authentication Fail")
            eel.hideFaceAuth()
            eel.hideFaceAuthSuccess()
            eel.hideStart()
    try:
        os.system('start msedge.exe --app="http://localhost:8000/index.html"')
    except Exception as e:
        print('[init] could not auto-launch browser:', e)

    eel.start('index.html', mode=None, host='localhost', block=True)