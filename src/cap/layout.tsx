import styled from 'styled-components'

/** Side panel chrome matching Captivate raised panels */
export const SidePanel = styled.aside`
  background: ${(p) => p.theme.colors.bg.panel};
  border-right: 1px solid ${(p) => p.theme.colors.divider};
  box-shadow: ${(p) => p.theme.elevation.shadowSidebar};
  display: flex;
  flex-direction: column;
  min-height: 0;
`

export const PanelHead = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding: 0.45rem 0.55rem;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
`

export const TopBar = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 2.25rem;
  padding: 0 0.45rem;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  background: ${(p) => p.theme.colors.bg.panel};
`

export const ToolRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  height: 2.35rem;
  padding: 0 0.45rem;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  background: ${(p) => p.theme.colors.bg.darker};
`

export const StatFoot = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  height: ${() => '2.5rem'};
  padding: 0 0.55rem;
  border-top: 1px solid ${(p) => p.theme.colors.divider};
  background: ${(p) => p.theme.colors.bg.panel};
  box-shadow: ${(p) => p.theme.elevation.shadowSm};
`

export const AppRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
`

export const BodyRow = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
`
