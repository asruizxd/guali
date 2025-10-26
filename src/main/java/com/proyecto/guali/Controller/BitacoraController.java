package com.proyecto.guali.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.guali.Entity.Bitacora;
import com.proyecto.guali.Service.BitacoraService;

@RestController
@RequestMapping("/api/bitacora")
@CrossOrigin(origins = "*")

public class BitacoraController {

    private final BitacoraService bitacoraService;

    public BitacoraController(BitacoraService bitacoraService) {
        this.bitacoraService = bitacoraService;
    }

    @GetMapping
    public List<Bitacora> listar() {
        return bitacoraService.listar();
    }

    @PostMapping
    public void registrar(@RequestBody Bitacora b) {
        bitacoraService.registrar(b.getUsuario(), b.getAccion());
    }

    @DeleteMapping
    public void limpiar() {
        bitacoraService.limpiar();
    }
}
