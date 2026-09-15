# TaskFlow - Especificación de API Backend (Java 17 / Spring Boot)

Esta especificación corresponde de manera exacta con el diagrama de base de datos relacional de MySQL (5 tablas: `roles`, `usuarios`, `proyectos`, `sprints`, `tareas`).

## Configuración recomendada
- **Tecnología**: Java 17 + Spring Boot 3.x (Spring Web, Spring Data JPA).
- **Puerto por defecto**: `8080` (`http://localhost:8080/api`).
- **CORS**: `@CrossOrigin(origins = "*")` en los controladores REST.

---

## Modelos de Datos (DTOs / JSON)

### 1. Usuario (`/api/users`)
*Consulta: `SELECT u.id, u.nombre, u.email, r.nombre AS rol FROM usuarios u JOIN roles r ON u.rol_id = r.id;`*
```json
{
  "id": 1,
  "name": "Carlos Admin",
  "email": "carlos.admin@taskflow.io",
  "role": "Admin",
  "roleId": 1
}
```

### 2. Tarea (`/api/tasks`)
*Consulta: `SELECT t.*, u.nombre AS responsable_nombre, r.nombre AS responsable_rol FROM tareas t LEFT JOIN usuarios u ON t.responsable_id = u.id LEFT JOIN roles r ON u.rol_id = r.id;`*
```json
{
  "id": 1,
  "title": "Integrar webhook para confirmación en tiempo real",
  "description": "Recepción y validación de firma criptográfica de pasarela QR.",
  "assignedUserId": 1,
  "assignedUserName": "Carlos Admin",
  "assignedUserRole": "Admin",
  "status": "En curso"
}
```
*Si la tarea no tiene responsable (`responsable_id IS NULL`), `assignedUserId` es `null`, `assignedUserName` es `"Sin asignar"` y `status` es `"Sin asignar"`.*

### 3. Proyecto (`/api/projects`)
*Consulta: `proyectos` + lista de participantes (líder del proyecto y usuarios asignados a tareas del proyecto).*
```json
{
  "id": 1,
  "name": "Pasarela de Pagos QR",
  "description": "Plataforma de procesamiento de cobros QR dinámicos con conciliación bancaria.",
  "status": "En progreso",
  "participantIds": [1, 2, 4]
}
```

---

## Endpoints REST requeridos en Java 17

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/users` | Lista de usuarios con su rol |
| `POST` | `/api/users` | Crear un nuevo usuario |
| `PUT` | `/api/users/{id}` | Actualizar un usuario existente |
| `DELETE` | `/api/users/{id}` | Eliminar un usuario |
| `GET` | `/api/tasks` | Lista de tareas con responsable y rol |
| `POST` | `/api/tasks` | Crear una nueva tarea |
| `PUT` | `/api/tasks/{id}` | Actualizar una tarea existente |
| `DELETE` | `/api/tasks/{id}` | Eliminar una tarea |
| `GET` | `/api/projects` | Lista de proyectos con sus participantes |
| `POST` | `/api/projects` | Crear un nuevo proyecto |
| `PUT` | `/api/projects/{id}` | Actualizar un proyecto |
| `DELETE` | `/api/projects/{id}` | Eliminar un proyecto |
| `POST` | `/api/auth/login` | Iniciar sesión (correo o username + password) |
| `POST` | `/api/auth/register` | Registrar nuevo usuario con 8 campos |
| `POST` | `/api/auth/recover/code` | Generar y enviar código de recuperación al correo |
| `POST` | `/api/auth/recover/verify` | Validar código de 6 dígitos |
| `POST` | `/api/auth/recover/reset` | Actualizar contraseña del usuario |

---

## Controladores de Autenticación (Java 17 / Spring Boot)

```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return authService.authenticate(req.getIdentifier(), req.getPassword());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        return authService.registerUser(req);
    }

    @PostMapping("/recover/code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> body) {
        return authService.generateRecoveryCode(body.get("email"));
    }

    @PostMapping("/recover/verify")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        return authService.verifyCode(body.get("email"), body.get("code"));
    }

    @PostMapping("/recover/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        return authService.resetPassword(body.get("email"), body.get("newPassword"));
    }
}
```
