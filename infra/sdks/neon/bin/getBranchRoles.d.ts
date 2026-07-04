import * as pulumi from "@pulumi/pulumi";
import * as inputs from "./types/input";
import * as outputs from "./types/output";
export declare function getBranchRoles(args: GetBranchRolesArgs, opts?: pulumi.InvokeOptions): Promise<GetBranchRolesResult>;
/**
 * A collection of arguments for invoking getBranchRoles.
 */
export interface GetBranchRolesArgs {
    branchId: string;
    id?: string;
    projectId: string;
    roles?: inputs.GetBranchRolesRole[];
}
/**
 * A collection of values returned by getBranchRoles.
 */
export interface GetBranchRolesResult {
    readonly branchId: string;
    readonly id: string;
    readonly projectId: string;
    readonly roles?: outputs.GetBranchRolesRole[];
}
export declare function getBranchRolesOutput(args: GetBranchRolesOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetBranchRolesResult>;
/**
 * A collection of arguments for invoking getBranchRoles.
 */
export interface GetBranchRolesOutputArgs {
    branchId: pulumi.Input<string>;
    id?: pulumi.Input<string>;
    projectId: pulumi.Input<string>;
    roles?: pulumi.Input<pulumi.Input<inputs.GetBranchRolesRoleArgs>[]>;
}
