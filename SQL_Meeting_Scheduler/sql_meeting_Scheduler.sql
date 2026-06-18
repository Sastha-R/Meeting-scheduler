create database meeting_scheduler

use meeting_scheduler

-- USERS TABLE
CREATE TABLE Users (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    Department NVARCHAR(100) NOT NULL,
    Designation NVARCHAR(100) NOT NULL,
    DateOfJoin DATE NOT NULL
);

-- MEETINGS TABLE
CREATE TABLE Meetings (
    Id NVARCHAR(50) PRIMARY KEY,
    Title NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX),
    MeetingDate DATE NOT NULL,
    MeetingTime TIME NOT NULL,
    Duration NVARCHAR(50) NOT NULL,
    Room NVARCHAR(100) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    OrganizerId NVARCHAR(50) NOT NULL,
    OrganizerName NVARCHAR(100) NOT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Scheduled',
    IsDeleted BIT NOT NULL DEFAULT 0,
    FOREIGN KEY (OrganizerId) REFERENCES Users(Id)
);

-- PARTICIPANTS TABLE
CREATE TABLE MeetingParticipants (
    MeetingId NVARCHAR(50) NOT NULL,
    UserId NVARCHAR(50) NOT NULL,
    PRIMARY KEY (MeetingId, UserId),
    FOREIGN KEY (MeetingId) REFERENCES Meetings(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);


DECLARE @Id VARCHAR(20) = 'WW123';
DECLARE @Name VARCHAR(100) = 'Walter White';
DECLARE @Email VARCHAR(100) = 'walter.white@abq.com';
DECLARE @Password VARCHAR(100) = 'Heisenberg@123';
DECLARE @Department VARCHAR(50) = 'Chemistry';
DECLARE @Designation VARCHAR(50) = 'Teacher';
DECLARE @DateOfJoin DATE = '2026-01-15';
--Register User
INSERT INTO Users
(Id, Name, Email, Password, Department, Designation, DateOfJoin)
VALUES
(@Id, @Name, @Email, @Password, @Department, @Designation, @DateOfJoin);



SET @Email = 'saul.goodman@abq.com';
SET @Password = 'BetterCallSaul@123';

--Login user
SELECT Id, Name, Email, Department, Designation, DateOfJoin
FROM Users
WHERE Email = @Email
  AND Password = @Password;

  

  --Create meeting
  SET @Id = 'MTG001';
  DECLARE @Title VARCHAR(200) = 'Los Pollos Hermanos Expansion';
DECLARE @Description VARCHAR(500) = 'Discussion about opening new branches.';
DECLARE @MeetingDate DATE = '2026-07-01';
DECLARE @MeetingTime TIME = '10:00:00';
DECLARE @Duration INT = 60;
DECLARE @Room VARCHAR(50) = 'Conference Room A';
DECLARE @Type VARCHAR(50) = 'Business';
DECLARE @OrganizerId VARCHAR(20) = 'SG001';
DECLARE @OrganizerName VARCHAR(100) = 'Saul Goodman';

  INSERT INTO Meetings
(Id, Title, Description, MeetingDate, MeetingTime, Duration, Room, Type,
 OrganizerId, OrganizerName, Status, IsDeleted)
VALUES
(@Id, @Title, @Description, @MeetingDate, @MeetingTime, @Duration, @Room, @Type,
 @OrganizerId, @OrganizerName, 'Scheduled', 0);


  --Add meeting participants
 DECLARE @MeetingId VARCHAR(20) = 'MTG001';
DECLARE @UserId VARCHAR(20) = 'JP001'; -- Jesse Pinkman

 INSERT INTO MeetingParticipants (MeetingId, UserId)
VALUES (@MeetingId, @UserId);


--Get Meetings Visible To Logged-In User

DECLARE @LoggedInUserId VARCHAR(20) = 'JP001';

SELECT DISTINCT m.*
FROM Meetings m
LEFT JOIN MeetingParticipants mp
    ON m.Id = mp.MeetingId
WHERE m.IsDeleted = 0
  AND (
        m.OrganizerId = @LoggedInUserId
        OR mp.UserId = @LoggedInUserId
      )
ORDER BY m.MeetingDate, m.MeetingTime;


--Filter Meetings By Status
DECLARE @Status VARCHAR(20) = 'Scheduled';

SELECT DISTINCT m.*
FROM Meetings m
LEFT JOIN MeetingParticipants mp
    ON m.Id = mp.MeetingId
WHERE m.IsDeleted = 0
  AND (@Status = 'All' OR m.Status = @Status)
  AND (
        m.OrganizerId = @LoggedInUserId
        OR mp.UserId = @LoggedInUserId
      )
ORDER BY m.MeetingDate, m.MeetingTime;


--Update/Edit Meeting

SET @MeetingId = 'MTG001';
SET @Title = 'Cartel Strategy Meeting';
SET @Description = 'Review quarterly operations and planning.';
SET @MeetingDate = '2026-07-05';
SET @MeetingTime = '14:00:00';
SET @Duration = 90;
SET @Room = 'Board Room';
SET @Type = 'Strategy';
SET @Status = 'Scheduled';


UPDATE Meetings
SET Title = @Title,
    Description = @Description,
    MeetingDate = @MeetingDate,
    MeetingTime = @MeetingTime,
    Duration = @Duration,
    Room = @Room,
    Type = @Type,
    Status = @Status
WHERE Id = @MeetingId;


--Update Meeting Status

SET @MeetingId = 'MTG001';
SET @Status = 'Completed';

UPDATE Meetings
SET Status = @Status
WHERE Id = @MeetingId;

--Soft Delete Meeting

SET @MeetingId = 'MTG001';


UPDATE Meetings
SET IsDeleted = 1
WHERE Id = @MeetingId;

--View Deleted Meeting
SELECT *
FROM Meetings
WHERE IsDeleted = 1
ORDER BY MeetingDate, MeetingTime;

