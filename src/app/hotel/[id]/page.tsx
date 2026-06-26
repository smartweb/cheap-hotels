import { HotelClient } from "./hotel-client";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  return <HotelClient hotelId={params.id} />;
}
