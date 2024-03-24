export default function PlaceImg({ place, index = 0, className = null }) {
  if (!place.photos?.length) return "";
  if (!className) className = "object-cover";
  return (
    <img
      className={className}
      src={
        "https://booking-website-server-v60j.onrender.com/uploads/" +
        place.photos[index]
      }
      alt=""
    />
  );
}
