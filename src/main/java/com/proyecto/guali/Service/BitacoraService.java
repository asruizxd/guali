package com.proyecto.guali.Service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.guali.Entity.Bitacora;
import com.proyecto.guali.Rpository.BitacoraRepository;


@Service
public class BitacoraService {

    private final BitacoraRepository repository;

    public BitacoraService(BitacoraRepository repository) {
        this.repository = repository;
    }

    public List<Bitacora> listar() {
        return repository.findAll();
    }

    public void limpiar() {
        repository.deleteAll();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String usuario, String accion) {
        Bitacora b = new Bitacora();
        b.setUsuario(usuario);
        b.setAccion(accion);
        b.setFechaHora(LocalDateTime.now());
        repository.save(b);
    }

}
