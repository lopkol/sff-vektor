'use client';

import { getExample } from "@/services/example"
import { useQuery } from "@tanstack/react-query"

export function DisplayExample() {
  const { data: example, isLoading } = useQuery({
    queryKey: ['example'],
    queryFn: getExample,
  })
 
  return (
    <div>
      {isLoading ? 'Loading...' : ''}
      <p>Example: {JSON.stringify(example)}</p>
    </div>
  )
}
