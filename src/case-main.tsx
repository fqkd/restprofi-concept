import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/playfair-display/500.css'
import './case.css'
import { CasePage } from './CasePage'

createRoot(document.getElementById('root')!).render(<React.StrictMode><CasePage /></React.StrictMode>)

