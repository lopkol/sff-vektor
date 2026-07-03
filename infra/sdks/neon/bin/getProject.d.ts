import * as pulumi from "@pulumi/pulumi";
export declare function getProject(args: GetProjectArgs, opts?: pulumi.InvokeOptions): Promise<GetProjectResult>;
/**
 * A collection of arguments for invoking getProject.
 */
export interface GetProjectArgs {
    id: string;
}
/**
 * A collection of values returned by getProject.
 */
export interface GetProjectResult {
    readonly connectionUri: string;
    readonly connectionUriPooler: string;
    readonly databaseHost: string;
    readonly databaseHostPooler: string;
    readonly databaseName: string;
    readonly databasePassword: string;
    readonly databaseUser: string;
    readonly defaultBranchId: string;
    readonly id: string;
    readonly name: string;
}
export declare function getProjectOutput(args: GetProjectOutputArgs, opts?: pulumi.InvokeOutputOptions): pulumi.Output<GetProjectResult>;
/**
 * A collection of arguments for invoking getProject.
 */
export interface GetProjectOutputArgs {
    id: pulumi.Input<string>;
}
