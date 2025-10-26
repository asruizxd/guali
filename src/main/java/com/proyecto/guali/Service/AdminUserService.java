package com.proyecto.guali.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.proyecto.guali.Entity.AdminUser;
import com.proyecto.guali.Rpository.AdminUserRepository;

@Service
public class AdminUserService {

    private final AdminUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(AdminUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    // --- GUARDAR O ACTUALIZAR ---
    @Transactional
    public AdminUser save(AdminUser user) {
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return repository.save(user);
    }

    // --- BUSCAR POR USERNAME ---
    @Transactional(readOnly = true)
    public Optional<AdminUser> findByUsername(String username) {
        return repository.findByUsername(username);
    }

    // --- VALIDAR CREDENCIALES ---
    public boolean validateCredentials(String username, String password) {
        Optional<AdminUser> userOpt = repository.findByUsername(username);
        if (userOpt.isEmpty()) return false;
        return passwordEncoder.matches(password, userOpt.get().getPassword());
    }

    // --- MÉTODOS PARA REGISTRO ---
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return repository.existsByUsername(username);
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }

    // --- NUEVOS MÉTODOS CRUD ---
    @Transactional(readOnly = true)
    public List<AdminUser> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<AdminUser> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
