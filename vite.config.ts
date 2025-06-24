import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks(id) {
  //         if (id.includes('node_modules')) {
  //           if (id.includes('react') || id.includes('react-dom')) {
  //             return 'vendor-react'; // Séparer le code lié à React
  //           }
  //           if (id.includes('lodash')) {
  //             return 'vendor-lodash'; // Séparer Lodash
  //           }
  //           return 'vendor'; // Autres bibliothèques
  //         }
  //       },
  //     },
  //   },
  // },
})
