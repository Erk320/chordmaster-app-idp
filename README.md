# 🎸 ChordMaster Live (Español)

> **Aplicación móvil Android y Web en tiempo real para músicos, bandas y ministerios de alabanza con sincronización en la nube.**  
> Visualiza acordes sobre la letra, transporta tonos al instante, usa auto-scroll manos libres, organiza repertorios, añade notas personales independientes por canción y gestiona el cancionero central con permisos de Administrador.

---

## 🚀 Despliegue en Render.com (Nube Gratuita 24/7)

Como ya tienes tu cuenta en [Render.com](https://render.com), sigue estos sencillos pasos para que tu aplicación esté en internet:

1. **Sube este proyecto a tu GitHub**:
   - Crea un repositorio nuevo en GitHub (ej. `chordmaster-app`).
   - Sube este proyecto con los siguientes comandos:
     ```bash
     git remote add origin https://github.com/TU-USUARIO/chordmaster-app.git
     git branch -M master
     git push -u origin master
     ```
2. **Conecta tu repositorio en Render**:
   - Entra en tu panel de [Render.com](https://dashboard.render.com).
   - Haz clic en **"New +"** y selecciona **"Web Service"**.
   - Conecta tu repositorio de GitHub recién creado.
   - Render detectará automáticamente el archivo `render.yaml` incluido:
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Variables de Entorno**: `ADMIN_PIN = 1234`
   - Haz clic en **"Create Web Service"**.
3. **¡Listo!** En 2 minutos Render te dará tu enlace público en la nube:
   `https://tu-servicio.onrender.com`

---

## 📱 Cómo Obtener y Compilar la APK de Android

Hemos dejado configurado el proyecto para que puedas obtener el archivo instalador `.apk` de **dos formas**:

### Método 1: Compilación Automática en la Nube con GitHub Actions (¡Recomendado, 0 Instalaciones!)
El proyecto incluye el archivo `.github/workflows/build-apk.yml`.
1. Cada vez que hagas `git push` a tu repositorio de GitHub, los servidores de GitHub **compilarán automáticamente la APK de Android** usando Java 17 y el Android SDK en la nube sin que tengas que instalar nada en tu computadora.
2. Para descargar tu APK compilada:
   - Ve a la pestaña **"Actions"** o a la pestaña **"Releases"** en tu repositorio de GitHub.
   - Verás el artefacto descargable: **`app-debug.apk`**.
   - Descárgalo directamente en tu teléfono Android, ábrelo e instálalo.

### Método 2: Conectar la APK a tu Servidor Render.com
Cuando abras la aplicación (o instales la APK en tu celular):
1. Toca el botón **"Nube Render"** (o el icono de la nube 🌐 en el menú inferior).
2. Pega la dirección de tu servidor de Render (ej. `https://tu-servicio.onrender.com`).
3. Presiona **"⚡ Probar y Guardar Conexión"**.
4. Verás una confirmación en verde: *"✓ ¡Conectado exitosamente!"*.
5. A partir de ese momento, cada canción que agregues o edites desde tu PC o celular como Administrador se actualizará al instante para todos los miembros de la banda en cualquier lugar del mundo.

### Método 3: Compilar Localmente con Android Studio (Opcional)
Si tienes Android Studio instalado en tu PC:
1. Abre la carpeta `android` en Android Studio.
2. Ve al menú superior **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
3. El archivo generado se guardará en:
   `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🌟 Funciones Principales

1. **Visor de Acordes y Letras**:
   - Acordes destacados sobre las sílabas exactas.
   - **Transporte de Tono**: Sube (`+1`) o baja (`-1`) semitonos con adaptación automática de sostenidos (`#`) y bemoles (`b`).
   - **Calculadora de Capo / Cejilla**: Te indica qué posición de cejilla colocar y qué figuras de acordes tocar para sonar en el tono deseado.
   - **Desplazamiento Automático (Auto-Scroll)**: Barra flotante manos libres con botón de Play/Pausa y regulador de velocidad de `0.5x` a `4.0x`.
   - **Diagramas de Acordes para Guitarra**: Toca cualquier acorde (`[G]`, `[Em]`, `[Bm]`) para ver un diagrama gráfico con los dedos y trastes exactos en el diapasón.
   - **Metrónomo y BPM**: Pulso visual y sonoro con Web Audio.

2. **Repertorios y Modo Escenario en Vivo**:
   - Crea listas de canciones para ensayos o conciertos.
   - Organiza el orden con botones para subir (`▲`) y bajar (`▼`).
   - **Modo Escenario**: Pantalla completa sin distracciones, con botones gigantes de navegación (`◀ Anterior`, `Siguiente ▶`) y soporte para pasar de canción **deslizando con el dedo** (swipe táctil).

3. **Notas Independientes por Canción**:
   - **Mis Notas Personales**: Cada músico guarda sus propios apuntes en su teléfono (ej. guitarra, batería, voz) con autoguardado local.
   - **Notas de la Banda**: Notas generales sincronizadas en la nube editables por el Administrador.

4. **Buscador Instantáneo y Biblioteca**:
   - Filtro en tiempo real por Nombre, Artista, Tono o fragmentos de la letra.
   - Filtros por Tonalidad (Do, Sol, Re, etc.) y ordenación (A-Z, Artista, Recientes).

5. **Modo Administrador**:
   - PIN por defecto: `1234`.
   - Editor con atajos para insertar acordes rápidos y vista previa en tiempo real.

---

## 💻 Ejecución Local en Windows

Para iniciar el servidor local en cualquier momento:
- Haz doble clic en el archivo [`start.bat`](file:///C:/Users/Erk320/.gemini/antigravity/scratch/chordmaster-app/start.bat).
- Acceso en tu PC: [http://localhost:3000](http://localhost:3000)
- Acceso en tu red Wi-Fi: Escanea el código QR que muestra el botón "Conectar Celular".
