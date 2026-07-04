import * as pulumi from "@pulumi/pulumi";
export declare function getBranchRolePassword(args: GetBranchRolePasswordArgs, opts?: pulumi.InvokeOptions): Promise<GetBranchRolePasswordResult>;
/**
 * A collection of arguments for invoking getBranchRolePassword.
 */
export interface GetBranchRolePasswordArgs {
    branchId: string;
    id?: string;
    projectId: string;
    roleName: string;
}
/**
 * A collection of values returned by getBranchRolePassword.
 */
export interface GetBranchRolePasswordResult {
    readonly branchId: string;
    readonly id: string;
    readonly password: string;
    readonly projectId: string;
    readonly roleName: string;
}
export declare function getBranchRolePasswordOutput(args: GetBranchRolePasswordOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetBranchRolePasswordResult>;
/**
 * A collection of arguments for invoking getBranchRolePassword.
 */
export interface GetBranchRolePasswordOutputArgs {
    branchId: pulumi.Input<string>;
    id?: pulumi.Input<string>;
    projectId: pulumi.Input<string>;
    roleName: pulumi.Input<string>;
}
