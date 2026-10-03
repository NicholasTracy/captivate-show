import { createGlobalStyle } from 'styled-components'

/** Captivate 2 global resets and dark body styling */
export default createGlobalStyle`
  html { height: 100%; -webkit-text-size-adjust: 100%; }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    height: 100%;
    font-size: 0.8rem;
    color: ${(p) => p.theme.colors.text.primary};
    background: ${(p) => p.theme.colors.bg.primary};
    font-family: Arial, Helvetica, sans-serif;
    user-select: none;
    overflow: hidden;
  }
  #root { height: 100%; min-height: 0; overflow: hidden; }
  *::-webkit-scrollbar { display: none; }
`
