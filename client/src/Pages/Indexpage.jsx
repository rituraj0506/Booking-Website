import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
export default function Indexpage() {
  const [places, setplaces] = useState([]);
  useEffect(() => {
    axios.get("/places").then((response) => {
      setplaces(response.data);
    });
  }, []);
  return (
    <div className="mt-8 grid gap-x-6 gap-y-7 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {places.length > 0 &&
        places.map((place) => (
          <Link to={"/place/" + place._id} id={place._id}>
            <div className="bg-gray-500 mb-2 rounded-2xl flex">
              {place.photos?.[0] && (
                <img
                  className="rounded-2xl object-cover aspect-square"
                  src={
                    "https://booking-website-server-v60j.onrender.com/uploads/" +
                    place.photos?.[0]
                  }
                  alt=""
                />
              )}
            </div>
            <h2 className="text-sm font-bold truncate leading-4">
              {place.title}
            </h2>
            <h3 className="leading-4">{place.address}</h3>

            <div className="mt-1">
              <span className="font-bold flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                {place.price} per person
              </span>
            </div>
          </Link>
        ))}
    </div>
  );
}

