import { Badge } from './ui/badge.jsx'

export default function Tooltip({ name, type, faction, destroyed, unofficial, capital, mobile }) {
  if (!name || mobile) return (<div className="map-tooltip"></div>)
  return (
    <div className="map-tooltip z-10 p-5 rounded-2xl absolute bg-black" style={{ border: '1px dashed gray', visibility: "hidden" }}>
      <p className='font-bold text-center'>{name}</p>
      <p className="text-center text-gray-400">{type}</p>
      <div className="flex flex-col items-center">
        {unofficial && <Badge variant="destructive" className="mx-auto my-1">unofficial</Badge>}
        {faction && <Badge className="mx-auto my-1">{faction}</Badge>}
        {destroyed && <Badge variant="secondary" className="mx-auto my-1">destroyed</Badge>}
        {capital && <Badge variant="secondary" className="mx-auto my-1">capital</Badge>}
      </div>
    </div>
  )
}
