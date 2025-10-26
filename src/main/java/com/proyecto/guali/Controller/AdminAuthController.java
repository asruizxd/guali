package com.proyecto.guali.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.proyecto.guali.Entity.AdminUser;
import com.proyecto.guali.Service.AdminUserService;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminAuthController {

    private final AdminUserService userService;

    public AdminAuthController(AdminUserService userService) {
        this.userService = userService;
    }

    // --- LOGIN ---
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        boolean valid = userService.validateCredentials(username, password);
        if (valid) {
            return ResponseEntity.ok("✅ Login exitoso");
        } else {
            return ResponseEntity.status(401).body("❌ Credenciales incorrectas");
        }
    }

    // --- REGISTER / CREAR NUEVO ADMIN ---
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String email = body.get("email");

        if (userService.existsByUsername(username)) {
            return ResponseEntity.status(400).body("❌ Usuario ya existe");
        }

        if (userService.existsByEmail(email)) {
            return ResponseEntity.status(400).body("❌ Email ya registrado");
        }

        AdminUser user = AdminUser.builder()
                                  .username(username)
                                  .password(password)
                                  .email(email)
                                  .build();

        userService.save(user);
        return ResponseEntity.ok("✅ Usuario registrado correctamente");
    }

    // --- LISTAR TODOS LOS ADMIN ---
    @GetMapping("/list")
    public List<AdminUser> listar() {
        return userService.findAll();
    }

    // --- ACTUALIZAR ADMIN ---
    @PutMapping("/users/{id}")
    public ResponseEntity<String> actualizar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<AdminUser> existente = userService.findById(id);
        if (existente.isEmpty()) return ResponseEntity.status(404).body("❌ Usuario no encontrado");

        AdminUser u = existente.get();
        u.setUsername(body.get("username"));
        u.setEmail(body.get("email"));
        if (body.get("password") != null && !body.get("password").isEmpty()) {
            u.setPassword(body.get("password"));
        }

        userService.save(u);
        return ResponseEntity.ok("✅ Usuario actualizado correctamente");
    }

    // --- ELIMINAR ADMIN ---
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> eliminar(@PathVariable Long id) {
        if (userService.findById(id).isEmpty()) return ResponseEntity.status(404).body("❌ Usuario no encontrado");

        userService.deleteById(id);
        return ResponseEntity.ok("✅ Usuario eliminado correctamente");
    }
}
