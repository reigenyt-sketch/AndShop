import requests
from base64 import b64decode
import os

URL_CAPTCHA = "https://api-gateway.sunarp.gob.pe:9443/sunarp/multiservicios/multiservicio-captcha/captcha/generar-crypt"

# Paso 1: solicitar captcha con POST
resp = requests.post(URL_CAPTCHA, json={}, verify=True)

if resp.status_code != 200:
    print("❌ Error al obtener captcha:", resp.status_code, resp.text)
    exit()

data = resp.json()
print("Respuesta captcha:", data)

# Puede venir como base64 o como URL
captcha_b64 = data.get("captcha")
captcha_key = data.get("captchaKey")

if captcha_b64:
    with open("captcha.png", "wb") as f:
        f.write(b64decode(captcha_b64))
    print("✅ Captcha guardado como captcha.png, ábrelo y resuélvelo.")
elif "url" in data:
    img = requests.get(data["url"], verify=True)
    with open("captcha.png", "wb") as f:
        f.write(img.content)
    print("✅ Captcha descargado de URL y guardado como captcha.png.")
    captcha_key = os.path.basename(data["url"])
else:
    print("❌ No encontré ni base64 ni URL en:", data)
    exit()
