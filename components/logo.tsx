export function Logo ({ size = 48 }: { size?: number }) {
    return (
     <img src="/globo.png" alt="LogoGestorTrip" width={size} height={size} style={{ borderRadius: 12, display: "block"}} />
    )
}