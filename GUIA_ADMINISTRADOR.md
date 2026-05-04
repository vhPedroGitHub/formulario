# UniForm — Guía del Administrador

## ¿Qué es UniForm?

UniForm es el sistema de gestión de formularios universitarios de la institución.
Centraliza la creación, distribución y análisis de formularios digitales, eliminando
el uso de papel y correo electrónico para recopilar información de estudiantes y personal.

---

## Beneficios del Sistema

- **Distribución precisa** — Los formularios llegan únicamente al público objetivo
  (facultad, carrera, grupo, rol especial o usuarios individuales), sin envíos masivos innecesarios.
- **Respuestas en tiempo real** — Las respuestas quedan registradas al instante; no hay que
  esperar entregas físicas ni consolidar planillas manuales.
- **Reportes automáticos en PDF** — El sistema genera informes con gráficos (torta, barras,
  escala) y tablas de respuestas con un solo clic.
- **Anonimato configurable** — Los formularios pueden marcarse como anónimos para obtener
  respuestas más honestas sin exponer la identidad del respondente.
- **Notificaciones automáticas** — Al publicar un formulario, todos los destinatarios reciben
  una notificación dentro del sistema sin ninguna acción adicional de tu parte.
- **Control de acceso granular** — Solo los usuarios confirmados y activos pueden responder;
  los accesos no autorizados son bloqueados a nivel de servidor.
- **Historial completo** — Cada formulario conserva todas sus respuestas, permitiendo
  consultas posteriores y auditorías.

---

## Cómo Trabajar como Administrador

### 1. Gestión de Usuarios

#### Confirmar cuentas pendientes

Los usuarios que se registran por cuenta propia quedan en estado **pendiente** hasta que
un administrador los aprueba.

1. En el menú lateral, ir a **Usuarios**.
2. Seleccionar la pestaña **Pendientes**.
3. Hacer clic en el botón **Confirmar** en la fila del usuario.

> Sin esta confirmación el usuario no puede iniciar sesión.

#### Crear un usuario manualmente

1. En **Usuarios**, hacer clic en **Crear usuario**.
2. Completar nombre, apellido, nombre de usuario y contraseña.
3. Asignar el rol (`admin` o `user`) y la ubicación académica
   (facultad → carrera → grupo) o un rol especial si corresponde.
4. Guardar — el usuario queda confirmado automáticamente.

#### Editar o desactivar una cuenta

- En la tabla de usuarios, hacer clic en el ícono de edición de la fila.
- Desde el modal se puede cambiar nombre, rol, asignación académica o
  desactivar la cuenta (el usuario no podrá iniciar sesión).

#### Eliminar un usuario

- Hacer clic en el ícono de eliminar de la fila correspondiente.
- Confirmar la acción en el diálogo. No es posible eliminarse a uno mismo.

---

### 2. Gestión de la Estructura Académica

Antes de crear usuarios y formularios, es recomendable tener la estructura académica cargada.

1. Ir a **Académico** en el menú lateral.
2. En la columna izquierda, crear las **Facultades**.
3. Seleccionar una facultad para ver sus **Carreras**; agregar cada carrera indicando
   duración en años y grupos por año (los grupos se generan automáticamente).
4. Seleccionar una carrera para ver sus **Grupos** y agregar o eliminar grupos individuales
   si fuera necesario.

---

### 3. Roles Especiales

Para usuarios que no pertenecen a la estructura facultad/carrera/grupo (docentes, directivos, personal administrativo):

1. Ir a **Roles Especiales**.
2. Crear los roles necesarios (ej. "Docente", "Director", "Personal Administrativo").
3. Al crear o editar un usuario, asignarle el rol especial correspondiente.

---

### 4. Crear un Formulario

1. Ir a **Formularios** → **Crear formulario**.
2. Completar la información general:
   - **Título** y **descripción** — la descripción admite saltos de línea y emojis, y se mostrará
     con el formato exacto que escribas.
   - **Fecha de inicio** y **fecha de cierre** (opcionales; fuera de este rango el formulario
     no aparece para los usuarios).
   - Activar **Anónimo** si no se quiere registrar la identidad del respondente.
   - Activar **Editable** si se quiere permitir que los usuarios modifiquen su respuesta.
3. Definir el **público destinatario** agregando una o más reglas:
   - `Todos` — todos los usuarios activos y confirmados.
   - `Facultad` — todos los usuarios de una facultad.
   - `Carrera` — todos los usuarios de una carrera.
   - `Grupo` — un grupo específico dentro de una carrera.
   - `Usuario` — un usuario individual.
   - `Rol especial` — todos los usuarios con un rol especial determinado.
4. Agregar los **campos** del formulario (ver tipos disponibles en la sección siguiente).
5. Hacer clic en **Guardar** — el formulario se publica y las notificaciones se envían
   automáticamente a todos los destinatarios.

---

### 5. Tipos de Campo

| Tipo | Descripción | ¿Admite opciones? |
|---|---|---|
| Texto corto | Respuesta de una línea | No |
| Texto largo | Respuesta de varias líneas | No |
| Número | Solo valores numéricos | No |
| Fecha | Selector de fecha | No |
| Opción única | El usuario elige una sola opción (radio) | Sí |
| Opción múltiple | El usuario puede marcar varias opciones (checkbox) | Sí |
| Escala 1–10 | Botones del 1 al 10 | No |
| Archivo adjunto | El usuario sube un archivo (máx. 10 MB) | No |

Cada campo puede configurarse como **obligatorio** (marcado con asterisco para el usuario).
También se puede agregar un **texto de ayuda** que aparece debajo de la etiqueta para orientar al usuario.

---

### 6. Lógica Condicional (Campos que Aparecen Según la Respuesta)

La lógica condicional permite que un campo se muestre u oculte en función de lo que el usuario
respondió en otro campo anterior. Esto hace los formularios más inteligentes: el usuario solo
ve las preguntas que le corresponden según sus respuestas.

#### ¿Cuándo usarla?

Siempre que tengas una pregunta de seguimiento que solo tiene sentido si el usuario respondió
algo específico antes. Algunos ejemplos:

- "¿Presentas dificultades?" → Si responde **Sí**, mostrar "Descríbelas".
- "¿Participas en actividades extracurriculares?" → Si responde **Sí**, mostrar "¿Cuáles?".
- "¿Tienes alguna observación?" → Si responde **Sí**, mostrar "Escribe tu observación".

#### Cómo configurarla paso a paso

Supongamos que quieres que el campo **"Descríbenos tu dificultad"** solo aparezca si el usuario
marcó **"Sí"** en el campo **"¿Presentas dificultades para evaluarte?"**.

**Paso 1 — Crear el campo disparador**

Agrega el campo `¿Presentas dificultades para evaluarte?` con tipo **Opción única (radio)**
y opciones `Sí` y `No`. Este campo debe estar **antes** del campo condicional en el formulario.

**Paso 2 — Crear el campo condicional**

Agrega el campo `Descríbenos tu dificultad` con tipo **Texto largo**.
Baja hasta la sección **"Mostrar condicionalmente"** dentro de ese campo y activa la casilla.

**Paso 3 — Configurar la condición**

Aparecerán tres controles en línea:

```
Mostrar si  [¿Presentas dificultades...? ▼]  [es igual a ▼]  [Sí]
```

- **Primer selector** — elegir el campo que actúa como disparador
  (`¿Presentas dificultades para evaluarte?`).
- **Segundo selector** — elegir el operador:
  - `es igual a` — el campo aparece cuando la respuesta coincide exactamente.
  - `no es igual a` — el campo aparece cuando la respuesta es diferente al valor indicado.
  - `contiene` — útil para campos de texto; el campo aparece si la respuesta incluye ese texto.
- **Tercer campo** — escribir el valor que dispara la aparición (en este caso `Sí`,
  respetando mayúsculas y minúsculas).

**Paso 4 — Guardar el formulario**

Al guardar, la lógica queda registrada. No es necesario hacer ninguna configuración adicional.

#### Comportamiento en el formulario

- Si el usuario selecciona **Sí** en el campo disparador → el campo condicional **aparece**.
- Si el usuario selecciona **No** (o no ha respondido nada) → el campo condicional **permanece oculto**.
- Si el campo condicional es **obligatorio**, esa obligatoriedad solo aplica cuando el campo
  **está visible** — si está oculto, el formulario se puede enviar sin inconvenientes.
- Si el usuario primero seleccionó Sí (el campo apareció), luego cambió a No (el campo se ocultó),
  la respuesta ingresada en el campo condicional se descarta automáticamente al enviar.

#### Restricciones importantes

- Un campo condicional solo puede referenciar a campos que están **antes** de él en el formulario.
- Los tipos de campo que pueden actuar como disparadores son: **opción única**, **opción múltiple**
  y **texto corto**.
- No está soportado encadenar condiciones (campo A dispara B que dispara C) — cada campo
  solo puede tener una condición directa.

---

### 7. Editar un Formulario

1. En **Formularios**, hacer clic en el ícono de edición (lápiz) de la fila del formulario.
2. Se abrirá el editor con todos los datos actuales cargados: título, descripción, fechas,
   audiencia y campos.
3. Realizar los cambios necesarios y hacer clic en **Guardar cambios**.

> **Advertencia importante:** Si el formulario ya tiene respuestas recopiladas, al guardar los
> cambios **se eliminarán todas las respuestas existentes** de forma permanente.
> El sistema mostrará un aviso con la cantidad de respuestas afectadas y pedirá confirmación
> antes de proceder. Descarga el reporte PDF antes de editar si quieres conservar los datos.

---

### 8. Ver Respuestas y Descargar Reportes

1. En **Formularios**, hacer clic en el ícono de ojo de la fila del formulario.
2. Se visualiza la tabla de respuestas con una columna por campo.
   - Si el formulario es anónimo, los datos de identidad no aparecen.
3. Hacer clic en **Descargar PDF** para obtener el reporte completo con gráficos
   y tablas de respuestas generado automáticamente.

---

### 9. Panel de Control (Dashboard)

La página de inicio del administrador muestra:

- **Total de usuarios** registrados.
- **Confirmaciones pendientes** — acceso directo para aprobar cuentas.
- **Formularios activos** en este momento.
- **Total de respuestas** recopiladas en el sistema.
- **Tabla de participación** de los últimos 20 formularios con porcentaje de respuesta
  respecto al público objetivo.

---

## Buenas Prácticas

- Confirmar las cuentas pendientes con regularidad para que los usuarios no queden bloqueados.
- Definir fechas de cierre en formularios con plazos para evitar respuestas tardías.
- Usar la opción **Anónimo** en encuestas de clima institucional o evaluaciones docentes.
- Revisar la tabla de participación del dashboard para identificar formularios con baja respuesta
  y recordar a los usuarios destinatarios.
- Mantener la estructura académica actualizada al inicio de cada ciclo lectivo.
- Descargar el reporte PDF **antes** de editar un formulario que ya tiene respuestas, ya que
  la edición elimina todas las respuestas recopiladas.
- En campos condicionales obligatorios, verificar que el valor del disparador esté escrito
  exactamente igual a la opción definida (las mayúsculas y minúsculas importan).
