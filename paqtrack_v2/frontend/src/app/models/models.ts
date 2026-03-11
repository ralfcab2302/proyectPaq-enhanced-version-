export interface Usuario {
  codigo_usuario: number;
  codigo_empresa: number | null;
  correo: string;
  rol: 'superadmin' | 'admin' | 'usuario';
}
export interface Empresa {
  codigo: number;
  nombre: string;
  contacto: string;
}
export interface Salida {
  codigo: number;
  codigo_empresa: number;
  nombre_empresa: string;
  nro_salida: number;
  codigo_barras: string;
  fecha_salida: string;
}
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}
export interface EstadisticasResponse {
  total: number;
  porSalida: { nro_salida: number; total: number }[];
  porEmpresa: { nombre_empresa: string; total: number }[];
  porDia: { dia: string; total: number }[];
}
