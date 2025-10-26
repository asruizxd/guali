package com.proyecto.guali.Controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.guali.Service.BitacoraService;

@RestController
@RequestMapping("/api/estadisticas")
@CrossOrigin(origins = "*")
public class EstadisticasController {

    private final BitacoraService bitacoraService;

    public EstadisticasController(BitacoraService bitacoraService) {
        this.bitacoraService = bitacoraService;
    }

    @GetMapping
    public Map<String, Object> obtenerEstadisticas() {
        var registros = bitacoraService.listar();

        long total = registros.size();
        long exitos = registros.stream()
                .filter(b -> b.getAccion().toLowerCase().contains("misión completada"))
                .count();
        long fallos = registros.stream()
                .filter(b -> b.getAccion().toLowerCase().contains("error") ||
                        b.getAccion().toLowerCase().contains("falló") ||
                        b.getAccion().toLowerCase().contains("fallida"))
                .count();

        Map<String, Object> data = new HashMap<>();
        data.put("total", total);
        data.put("exitos", exitos);
        data.put("fallos", fallos);

        return data;
    }
}
