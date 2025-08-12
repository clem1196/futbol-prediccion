import { Request, Response } from "express";
import {} from "typeorm";
import { Usuario } from "../entities/Usuario";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
import AppDataSource from "../data-source";

dotenv.config();

export const register = async (req: Request, res: Response) => {
  const { email, nombre, password } = req.body;
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  try {
    // Verificar si ya existe el email
    const existe = await usuarioRepo.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ message: "Email ya registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = usuarioRepo.create({
      email,
      nombre,
      password: hashedPassword,
    });

    await usuarioRepo.save(nuevoUsuario);
    //verificar el JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no está definido en el archivo .env");
    }
    // Generar token
    const token = jwt.sign({ id: nuevoUsuario.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Usuario registrado",
      token,
      usuario: { id: nuevoUsuario.id, email, nombre },
    });
// oxlint-disable-next-line no-unused-vars
  } catch (error) {
    return res.status(500).json({ message: "Error en el servidor" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  try {
     // Validar entrada
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
    // Buscar usuario
    const usuario = await usuarioRepo.findOne({ where: { email } });
    if (!usuario) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }
    //verificar el JWT_SECRET
    if (!process.env.JWT_SECRET) {
       console.error('❌ JWT_SECRET no está definido');
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
    // Generar token
    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login exitoso",
      token,
      usuario: { id: usuario.id, email, nombre: usuario.nombre },
    });
  } catch (error:any) {
    console.error('❌ Error en login:', error); // 🔥 Verás si hay un error de sintaxis o JWT
    return res.status(500).json({ 
      message: 'Error en el servidor',
      detail: error.message 
    });
  }
};
