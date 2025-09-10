// src/components/ExperimentResultsTable.tsx

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExperimentResultItem } from "../lib/api"; // Import the correct type

const ExperimentResultsTable = ({ results }: { results: ExperimentResultItem[] | null }) => {
  if (!results || results.length === 0) {
    return null;
  }

  const flattenedResults = results.flatMap(providerResult =>
    providerResult.modalities.map(modalityResult => ({
      provider: providerResult.provider_name,
      model: providerResult.model_name,
      modality: modalityResult.modality,
      tokens_used: modalityResult.tokens_used,
      time_taken: modalityResult.time_taken_s,
      cost: modalityResult.cost_usd,
      accuracy: modalityResult.accuracy_score,
      performance: modalityResult.performance_score,
    }))
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Modality</TableHead>
            <TableHead className="text-right">Tokens Used</TableHead>
            <TableHead className="text-right">Time (s)</TableHead>
            <TableHead className="text-right">Cost (USD)</TableHead>
            <TableHead className="text-right">Accuracy (%)</TableHead>
            <TableHead className="text-right">Perf. Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flattenedResults.map((result, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{result.provider}</TableCell>
              <TableCell>{result.model}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {result.modality}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{result.tokens_used}</TableCell>
              <TableCell className="text-right">{result.time_taken.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-green-600">${result.cost.toFixed(5)}</span>
              </TableCell>
              <TableCell className="text-right">{result.accuracy.toFixed(2)}%</TableCell>
              <TableCell className="text-right">{result.performance.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExperimentResultsTable;