using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TasklyApp.Migrations
{
    /// <inheritdoc />
    public partial class DeleteCascadeForTaskAndTaskActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_TaskActivities_ParentActivityId",
                table: "TaskComments");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskComments_TaskComments_ParentCommentId",
                table: "TaskComments");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_TaskActivities_ParentActivityId",
                table: "TaskComments",
                column: "ParentActivityId",
                principalTable: "TaskActivities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskComments_TaskComments_ParentCommentId",
                table: "TaskComments",
                column: "ParentCommentId",
                principalTable: "TaskComments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
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
    }
}
