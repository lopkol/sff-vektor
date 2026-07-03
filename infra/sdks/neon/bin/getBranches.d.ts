import * as pulumi from "@pulumi/pulumi";
import * as outputs from "./types/output";
export declare function getBranches(args: GetBranchesArgs, opts?: pulumi.InvokeOptions): Promise<GetBranchesResult>;
/**
 * A collection of arguments for invoking getBranches.
 */
export interface GetBranchesArgs {
    id?: string;
    projectId: string;
}
/**
 * A collection of values returned by getBranches.
 */
export interface GetBranchesResult {
    readonly branches: outputs.GetBranchesBranch[];
    readonly id: string;
    readonly projectId: string;
}
export declare function getBranchesOutput(args: GetBranchesOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetBranchesResult>;
/**
 * A collection of arguments for invoking getBranches.
 */
export interface GetBranchesOutputArgs {
    id?: pulumi.Input<string>;
    projectId: pulumi.Input<string>;
}
