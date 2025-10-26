package com.proyecto.guali.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.proyecto.guali.Entity.Pista;
import com.proyecto.guali.Rpository.PistaRepository;

@Service
public class PistaService {

    private final PistaRepository repository;
    private final BitacoraService bitacoraService;
    private final ObjectMapper objectMapper;

    public PistaService(PistaRepository repository, BitacoraService bitacoraService) {
        this.repository = repository;
        this.bitacoraService = bitacoraService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // JSON legible
    }

    // --- Consultas ---
    @Transactional(readOnly = true)
    public List<Pista> findAll() {
        bitacoraService.registrar("sistema", "Consultó todas las pistas registradas");
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Pista> findById(Long id) {
        Optional<Pista> pista = repository.findById(id);
        if (pista.isPresent()) {
            bitacoraService.registrar("sistema", "Consultó la pista con ID " + id + " (" + pista.get().getNombre() + ")");
        } else {
            bitacoraService.registrar("sistema", "Intentó consultar una pista inexistente con ID " + id);
        }
        return pista;
    }

    // --- Guardar pista ---
    @Transactional
    public Pista guardarPista(String nombre, int[][] tablero) {
        if (tablero == null) {
            bitacoraService.registrar("admin", "Error: intento de guardar pista con tablero nulo");
            throw new IllegalArgumentException("El tablero no puede ser null");
        }

        try {
            // Convertir la matriz a JSON
            String json = objectMapper.writeValueAsString(tablero);

            // Crear la entidad Pista
            Pista pista = new Pista();
            pista.setNombre(nombre);
            pista.setTableroJson(json);

            // Guardar en la base de datos
            Pista guardada = repository.save(pista);
            bitacoraService.registrar("admin", "Guardó la pista '" + nombre + "' correctamente");
            return guardada;

        } catch (JsonProcessingException e) {
            bitacoraService.registrar("admin", "Error al convertir tablero a JSON: " + e.getMessage());
            throw new RuntimeException("Error al convertir tablero a JSON", e);
        } catch (Exception e) {
            bitacoraService.registrar("admin", "Error inesperado al guardar pista: " + e.getMessage());
            throw e;
        }
    }

    // --- Convertir JSON a matriz ---
    public int[][] convertToMatrix(Pista pista) {
        if (pista == null || pista.getTableroJson() == null) {
            bitacoraService.registrar("sistema", "Error: intento de convertir pista nula o sin JSON");
            throw new IllegalArgumentException("Pista o tableroJson es null");
        }

        try {
            return objectMapper.readValue(pista.getTableroJson(), int[][].class);
        } catch (JsonProcessingException e) {
            bitacoraService.registrar("sistema", "Error al convertir JSON a tablero: " + e.getMessage());
            throw new RuntimeException("Error al convertir JSON a tablero", e);
        }
    }

    // --- Eliminar pista ---
    @Transactional
    public void delete(Long id) {
        try {
            Optional<Pista> pistaOpt = repository.findById(id);
            if (pistaOpt.isPresent()) {
                repository.deleteById(id);
                bitacoraService.registrar("admin", "Eliminó la pista '" + pistaOpt.get().getNombre() + "' (ID: " + id + ")");
            } else {
                bitacoraService.registrar("admin", "Intentó eliminar una pista inexistente (ID: " + id + ")");
            }
        } catch (Exception e) {
            bitacoraService.registrar("admin", "Error al eliminar pista (ID " + id + "): " + e.getMessage());
            throw e;
        }
    }
}
