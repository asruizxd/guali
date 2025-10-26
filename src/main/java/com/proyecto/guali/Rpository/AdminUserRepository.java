package com.proyecto.guali.Rpository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.guali.Entity.AdminUser;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {

    Optional<AdminUser> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

}   
