### Guía paso a paso para dar de alta un nuevo piso

#### Paso 1: Prepara las fotos del nuevo piso

1. Crea una carpeta nueva dentro de `assets/images/apartments/` con el nombre del slug del piso (ej. `chueca-303`).
   - Ruta completa: `assets/images/apartments/chueca-303/`

2. Sube al menos estas dos fotos (recomendadas):
   - `portada.jpg` → foto principal (la que aparece en el encabezado grande / hero de la guía)
   - `acceso.jpg` → foto opcional del acceso (caja fuerte, puerta, etc.)

   **Consejos para fotos**:
   - Tamaño recomendado: 1200×800 px o superior (horizontal)
   - Formato: JPG (peso < 300 KB cada una para carga rápida)
   - Nombres exactos: `portada.jpg` y `acceso.jpg` (si no existe `acceso.jpg`, la guía no se rompe, solo no muestra esa sección)

#### Paso 2: Edita `data/apartments.json`

1. Abre `data/apartments.json` en tu editor (VS Code recomendado).
2. Copia un apartamento existente completo (ej. el bloque de `"sol-101"`, incluyendo `{` y `}`).
3. Pégalo justo después del último apartamento (antes del cierre final `}`).
4. Cambia la clave y los datos clave. Ejemplo completo para un nuevo piso:

```json
"chueca-303": {
  "id": "chueca-303",
  "slug": "chueca-303",
  "name": "Apartamento Chueca 303",
  "address": "Calle Fuencarral 303, Madrid",
  "zone": "chueca",                    // importante para recomendaciones futuras
  "images": {
    "portada": "assets/images/apartments/chueca-303/portada.jpg",
    "acceso": "assets/images/apartments/chueca-303/acceso.jpg"
  },
  "host": {
    "name": "Nombre del Anfitrión",
    "phone": "+34 600 999 999"
  },
  "wifi": {
    "network": "WiFi_Chueca303",
    "password": "clavewifi303"
  },
  "access": {
    "type": "keybox",
    "code": "9999A",
    "instructions": [
      "Busca la caja negra junto a la puerta.",
      "Introduce el código y tira de la palanca."
    ]
  },
  "devices": {
    "climatzacion": { "type": "central", "detailsKey": "climatizacion_central" },
    // ... copia o adapta los dispositivos que necesites ...
  },
  "houseRules": [
    { "icon": "smoke_free", "titleKey": "rules_no_smoking", "color": "red" },
    // ... copia o personaliza ...
  ],
  "raixerDevices": {
    "deviceId": "ID_RAIXER_ESPECIFICO_DE_ESTE_PISO"  // ← OBLIGATORIO si quieres apertura de puertas
  },
  "emergency": {
    "apartmentId": "C3",
    "host": {
      "name": "Nombre del Anfitrión",
      "role": "Property Manager",
      "phone": "+34 600 999 999",
      "whatsapp": "+34 600 999 999",
      "photo": "https://lh3.googleusercontent.com/...",
      "online": true,
      "availability": {
        "general": "09:00 - 22:00",
        "emergency": "24/7"
      }
    },
    "services": [ /* copia los servicios de emergencia */ ]
  }
}
```

**Campos obligatorios mínimos** (para que cargue sin errores):
- `"id"` y `"slug"` → mismo valor, único
- `"name"` y `"address"`
- `"images.portada"` → ruta a la foto del encabezado
- `"raixerDevices.deviceId"` → si quieres apertura de puertas (pregunta al cliente por el ID real de Raixer de ese piso)

Guarda el archivo.

#### Paso 3: Subir todo a GitHub (despliegue automático)

1. Sube las fotos nuevas a la carpeta que creaste (`assets/images/apartments/chueca-303/`).
2. Guarda los cambios en `apartments.json`.
3. Commit y push al repositorio (GitHub Desktop o comando `git push`).
   - GitHub Pages actualiza automáticamente en **1–5 minutos**.

#### Paso 4: Obtener el enlace del nuevo piso

El enlace siempre es:

```
https://aurotek-prog.github.io/guia-madrid_v3/?apartment=SLUG_DEL_PISO
```

Para el nuevo piso:
- https://aurotek-prog.github.io/guia-madrid_v3/?apartment=chueca-303

**Con idioma específico** (opcional):
- Inglés: `...?apartment=chueca-303&lang=en`
- Francés: `...?apartment=chueca-303&lang=fr`

#### Paso 5: Compartir con tu cliente gestor

Envíale esta lista simple (por WhatsApp o email):

**Guías digitales de tus apartamentos**  
- Sol 101: https://aurotek-prog.github.io/guia-madrid_v3/?apartment=sol-101  
- Gran Vía 205: https://aurotek-prog.github.io/guia-madrid_v3/?apartment=granvia-205  
- Chueca 303: https://aurotek-prog.github.io/guia-madrid_v3/?apartment=chueca-303  

**Cómo añadir uno nuevo tú mismo:**
1. Crea carpeta con fotos: `assets/images/apartments/nuevo-slug/`  
2. Sube `portada.jpg` (foto principal del encabezado) y opcional `acceso.jpg`
3. Edita `data/apartments.json`: copia un bloque existente, cambia:
   - clave `"nuevo-slug"`
   - `"id"` y `"slug"` al mismo valor
   - `"name"`, `"address"`, `"zone"`
   - `"images.portada"` a la ruta nueva
   - `"raixerDevices.deviceId"` al ID real de Raixer de ese piso
4. Commit y push → ¡el enlace nuevo aparece automáticamente!
