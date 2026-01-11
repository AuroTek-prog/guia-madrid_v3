### Estructura actual del proyecto 

```
guia-madrid_v3/
│
├── .gitignore                  # Ignorar node_modules, .env, etc.
├── README.md                   # Este archivo que estás leyendo
├── index.html                  # Página principal (selector de idioma + navegación)
│
├── pages/
│   ├── essentials.html         # Información esencial (WiFi, acceso, reglas, Raixer)
│   ├── devices.html            # Dispositivos del apartamento
│   ├── recommendations.html    # Recomendaciones (restaurantes, tiendas, etc.)
│   ├── tourism.html            # Guía turística de Madrid
│   └── contact.html            # Contacto y emergencias
│
├── js/
│   ├── main.js                 # Estado global, fetch datos, t(), goBack(), setupBottomNavigation
│   ├── index.js                # Lógica específica de la home (renderPage, changeLanguage, startGuide)
│   ├── essentials.js           # Lógica de essentials (Raixer dinámico con /doors, LEDs, etc.)
│   ├── devices.js              # Render dispositivos (si existe)
│   ├── recommendations.js      # Render recomendaciones
│   └── tourism.js              # Lógica de turismo (si existe)
│
├── data/
│   ├── apartments.json         # Todos los pisos (multi-apartamento dinámico)
│   ├── es.json                 # Traducciones español
│   ├── en.json                 # Inglés
│   ├── fr.json                 # Francés
│   └── de.json                 # Alemán
│
├── assets/
│   └── images/
│       ├── apartments/
│       │   ├── sol-101/
│       │   │   ├── portada.jpg
│       │   │   ├── acceso.jpg
│       │   │   └── host.jpg
│       │   └── granvia-205/
│       │       └── portada.jpg
│       └── madrid/             # Imágenes genéricas (si las usas)
│
└── gestor.html                 # Panel para el gestor (lista dinámica + copiar enlaces)
```

### README.md (copia y pega directamente)

```markdown
# Guía Digital para Huéspedes - Aurotek Guest

Guía inteligente y personalizada para apartamentos turísticos en Madrid.  
Multi-idioma, multi-apartamento, con integración Raixer para apertura de puertas.

## Características principales

- **Multi-apartamento**: Cada piso tiene su propia guía (WiFi, acceso, reglas, Raixer, recomendaciones).
- **Idiomas**: Español, Inglés, Francés, Alemán (ampliable).
- **Raixer dinámico**: Detecta puertas reales vía API (`/doors`), botones y LEDs solo para puertas existentes.
- **Fallbacks visuales**: Nada se queda "Cargando...", mensajes claros si falta info.
- **Panel gestor**: `gestor.html` → lista dinámica de apartamentos, botones "Abrir Guía" y "Copiar enlace".
- **Responsive y moderno**: Tailwind CSS + Manrope + Material Symbols.
- **Despliegue**: GitHub Pages (estático, sin backend por ahora).

## Estructura del proyecto

```
guia-madrid_v3/
├── index.html              # Página principal
├── pages/                  # Secciones internas
│   ├── essentials.html
│   ├── devices.html
│   ├── recommendations.html
│   ├── tourism.html
│   └── contact.html
├── js/                     # Lógica JavaScript
│   ├── main.js
│   ├── index.js
│   ├── essentials.js       # (Raixer dinámico aquí)
│   └── ...
├── data/                   # Datos y traducciones
│   ├── apartments.json     # ¡Todos los pisos aquí!
│   ├── es.json, en.json...
├── assets/images/          # Fotos por apartamento + genéricas
└── gestor.html             # Panel para el anfitrión/gestor
```

## Cómo añadir un nuevo apartamento (para el gestor)

1. Crea carpeta: `assets/images/apartments/nuevo-slug/`  
2. Sube fotos:  
   - `portada.jpg` → foto principal (encabezado)  
   - Opcional: `acceso.jpg`  
3. Edita `data/apartments.json`:  
   - Copia un bloque existente (ej. "sol-101")  
   - Cambia la clave a `"nuevo-slug"`  
   - Actualiza: `name`, `address`, `zone`, `images.portada`, `wifi`, `access`, `raixerDevices.deviceId`  
4. Commit y push → ¡la guía y `gestor.html` se actualizan automáticamente!

**Enlace del panel gestor**:  
https://aurotek-prog.github.io/guia-madrid_v3/gestor.html

## Cómo usar la guía (para huéspedes)

Enlace general:  
https://aurotek-prog.github.io/guia-madrid_v3/?apartment=SLUG_DEL_PISO

Ejemplos:
- Sol 101: `...?apartment=sol-101`
- Gran Vía 205: `...?apartment=granvia-205`
- Inglés: `...?apartment=sol-101&lang=en`

## Tecnologías

- HTML + Tailwind CSS (CDN)
- JavaScript vanilla (sin frameworks pesados)
- Fetch API para datos
- Material Symbols (Google Icons)
- GitHub Pages (despliegue gratuito)

## Futuras mejoras planeadas

- Backend (Fastify + DB) → Raixer seguro (key oculta), panel de gestión real
- Recomendaciones dinámicas por zona/partners
- Notificaciones push o WhatsApp para emergencias

## Licencia

MIT License – libre para uso personal y comercial.

¡Disfruta de tu estancia en Madrid! 🏙️✨

Creado con ❤️ por Aurotek – 2026
```
