import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare function getBranchEndpoints(args: GetBranchEndpointsArgs, opts?: pulumi.InvokeOptions): Promise<GetBranchEndpointsResult>;
/**
 * A collection of arguments for invoking getBranchEndpoints.
 */
export interface GetBranchEndpointsArgs {
    branchId: string;
    endpoints?: inputs.GetBranchEndpointsEndpoint[];
    id?: string;
    projectId: string;
}
/**
 * A collection of values returned by getBranchEndpoints.
 */
export interface GetBranchEndpointsResult {
    readonly branchId: string;
    readonly endpoints?: outputs.GetBranchEndpointsEndpoint[];
    readonly id: string;
    readonly projectId: string;
}
export declare function getBranchEndpointsOutput(args: GetBranchEndpointsOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetBranchEndpointsResult>;
/**
 * A collection of arguments for invoking getBranchEndpoints.
 */
export interface GetBranchEndpointsOutputArgs {
    branchId: pulumi.Input<string>;
    endpoints?: pulumi.Input<pulumi.Input<inputs.GetBranchEndpointsEndpointArgs>[]>;
    id?: pulumi.Input<string>;
    projectId: pulumi.Input<string>;
}
