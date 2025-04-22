import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Farm } from "@/lib/types";
import { Link } from "wouter";

interface FarmOverviewProps {
  farms?: Farm[];
  isLoading: boolean;
}

export default function FarmOverview({ farms, isLoading }: FarmOverviewProps) {
  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-4">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Visão Geral das Fazendas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {farms?.map((farm) => (
            <Link 
              key={farm.id} 
              href={`/fazendas/${farm.id}`}
              className="rounded-lg overflow-hidden relative h-44 cursor-pointer"
            >
              <img 
                src={farm.image} 
                alt={farm.name} 
                className="h-full w-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-3 text-white">
                  <p className="font-semibold">{farm.name}</p>
                  <p className="text-sm">{farm.area} hectares</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
