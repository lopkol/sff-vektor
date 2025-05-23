import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function PageSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-8 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}
