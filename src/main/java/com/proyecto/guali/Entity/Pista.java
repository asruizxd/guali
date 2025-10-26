package com.proyecto.guali.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "pistas")
public class Pista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(name = "tablero_json", columnDefinition = "TEXT")
    private String tableroJson;

    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTableroJson() { return tableroJson; }
    public void setTableroJson(String tableroJson) { this.tableroJson = tableroJson; }
    public static Object builder() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'builder'");
    }
}
