using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rms.Av.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpUsageTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OtpUsages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: false),
                    RequestCount = table.Column<int>(type: "INTEGER", nullable: false),
                    FirstRequestedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastRequestedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpUsages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OtpUsages_PhoneNumber",
                table: "OtpUsages",
                column: "PhoneNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OtpUsages");
        }
    }
}
