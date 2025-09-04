using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TasklyApp.Migrations
{
    /// <inheritdoc />
    public partial class RearchitectCommentsForActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_Tasks_TaskId",
                table: "TaskComments");

            migrationBuilder.DropIndex(
                name: "IX_TaskComments_TaskId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "TaskComments");

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "TaskComments",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(1000)",
                oldMaxLength: 1000)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ParentActivityId",
                table: "TaskComments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentCommentId",
                table: "TaskComments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_ParentActivityId",
                table: "TaskComments",
                column: "ParentActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_ParentCommentId",
                table: "TaskComments",
                column: "ParentCommentId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_TaskActivities_ParentActivityId",
                table: "TaskComments",
                column: "ParentActivityId",
                principalTable: "TaskActivities",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_TaskComments_ParentCommentId",
                table: "TaskComments",
                column: "ParentCommentId",
                principalTable: "TaskComments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_TaskActivities_ParentActivityId",
                table: "TaskComments");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_TaskComments_ParentCommentId",
                table: "TaskComments");

            migrationBuilder.DropIndex(
                name: "IX_TaskComments_ParentActivityId",
                table: "TaskComments");

            migrationBuilder.DropIndex(
                name: "IX_TaskComments_ParentCommentId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "ParentActivityId",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "ParentCommentId",
                table: "TaskComments");

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "TaskComments",
                type: "varchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "TaskComments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "TaskComments",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_TaskId",
                table: "TaskComments",
                column: "TaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_Tasks_TaskId",
                table: "TaskComments",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
