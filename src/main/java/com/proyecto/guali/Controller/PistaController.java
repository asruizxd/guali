package com.proyecto.guali.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.guali.Entity.Pista;
import com.proyecto.guali.Service.PistaService;
import com.proyecto.guali.Service.BitacoraService;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/pistas")
@CrossOrigin(origins = "*")
public class PistaController {

    private final PistaService pistaService;
    private final BitacoraService bitacoraService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PistaController(PistaService pistaService, BitacoraService bitacoraService) {
        this.pistaService = pistaService;
        this.bitacoraService = bitacoraService;
    }

    // 🔹 Obtener la última pista registrada
    @GetMapping
    public ResponseEntity<?> obtenerUltimaPista() {
        try {
            List<Pista> pistas = pistaService.findAll();
            if (pistas.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("mensaje", "No hay pistas registradas."));
            }

            Pista ultima = pistas.get(pistas.size() - 1);

            if (ultima.getTableroJson() == null || ultima.getTableroJson().isBlank()) {
                bitacoraService.registrar("sistema", "Pista sin datos de tablero: " + ultima.getNombre());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "La pista no tiene datos válidos en tablero_json"));
            }

            int[][] tablero;
            try {
                tablero = objectMapper.readValue(ultima.getTableroJson(), int[][].class);
            } catch (Exception e) {
                bitacoraService.registrar("sistema", "Error al convertir JSON de la pista: " + ultima.getNombre());
                tablero = new int[5][5]; // Fallback vacío
            }

            bitacoraService.registrar("usuario", "Consultó la pista: " + ultima.getNombre());

            return ResponseEntity.ok(Map.of(
                    "id", ultima.getId(),
                    "nombre", ultima.getNombre(),
                    "tablero", tablero
            ));

        } catch (Exception e) {
            bitacoraService.registrar("sistema", "Error al obtener la pista: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al obtener la pista: " + e.getMessage()));
        }
    }

    // 🔹 Guardar una nueva pista
    @PostMapping
    public ResponseEntity<String> guardarPista(@RequestBody Map<String, Object> data) {
        try {
            String nombre = (String) data.get("nombre");
            int[][] tablero = objectMapper.convertValue(data.get("tablero"), int[][].class);
            pistaService.guardarPista(nombre, tablero);

            bitacoraService.registrar("admin", "Guardó la pista: " + nombre);
            return ResponseEntity.ok("✅ Pista guardada correctamente");

        } catch (Exception e) {
            bitacoraService.registrar("sistema", "Error al guardar pista: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al guardar la pista: " + e.getMessage());
        }
    }

    // 🔹 Obtener pista por ID
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPistaPorId(@PathVariable Long id) {
        Optional<Pista> pistaOpt = pistaService.findById(id);
        if (pistaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Pista no encontrada"));
        }

        Pista pista = pistaOpt.get();
        try {
            int[][] tablero = objectMapper.readValue(pista.getTableroJson(), int[][].class);
            bitacoraService.registrar("usuario", "Consultó pista por ID: " + pista.getNombre());

            return ResponseEntity.ok(Map.of(
                    "id", pista.getId(),
                    "nombre", pista.getNombre(),
                    "tablero", tablero
            ));
        } catch (Exception e) {
            bitacoraService.registrar("sistema", "Error al leer JSON de pista ID " + id);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al convertir tablero JSON: " + e.getMessage()));
        }
    }

    // 🔹 Eliminar pista
    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarPista(@PathVariable Long id) {
        try {
            pistaService.delete(id);
            bitacoraService.registrar("admin", "Eliminó la pista con ID: " + id);
            return ResponseEntity.ok("✅ Pista eliminada correctamente");
        } catch (Exception e) {
            bitacoraService.registrar("sistema", "Error al eliminar pista: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar la pista: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public List<Pista> listarPistas() {
        return pistaService.findAll();
    }
}
