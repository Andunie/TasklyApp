using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TasklyApp.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToTaskActivity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "TaskActivities",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "TaskActivities");
        }
    }
}
