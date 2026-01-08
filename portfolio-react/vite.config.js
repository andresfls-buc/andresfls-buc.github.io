import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Esto es CLAVE para que los estilos y fotos carguen en GitHub
  build: {
    outDir: '../docs', // Envía la web terminada a la carpeta docs que GitHub usará
    emptyOutDir: true, 
  }
})